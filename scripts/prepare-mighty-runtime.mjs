// One-time, additive local migration. Never uploads data or removes the source.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
const source = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(),'AppData','Local'), 'hermes');
const target = path.join(path.dirname(source), 'Mighty');
const marker = path.join(target, 'mighty-runtime.json');
const pending = path.join(target, '.mighty-migration-pending');
if (source === target || path.basename(target) !== 'Mighty') throw Error('Invalid migration destination');
if (fs.existsSync(marker)) { console.log('Mighty runtime already prepared.'); process.exit(0); }
if (!fs.existsSync(path.join(source,'hermes-agent','venv','Scripts','python.exe'))) throw Error('Working source runtime missing');
if (fs.existsSync(target) && !fs.existsSync(pending)) throw Error('Destination already exists; inspect it before migration.');
fs.mkdirSync(target, {recursive:true});
fs.writeFileSync(pending, 'Additive migration in progress; source untouched.');
const ignored = new Set(['__pycache__','cache','logs','node_modules','.venv','audio_cache','image_cache','pending_messages','pairing','gateway-service','state-snapshots','sandboxes']);
const transient = /(?:\.pid|\.lock|\.log|\.db(?:-wal|-shm)?|\.sqlite3?(?:-wal|-shm)?)$/i;
const skippedFiles = new Set(['processes.json','gateway_state.json','fleet_restart_pending','spawn-ledger.json','.skills_prompt_snapshot.json','endpoint.json','active_sessions.json']);
console.log('Copying local engine, configuration, memory and skills into Mighty...');
fs.cpSync(source,target,{recursive:true,force:false,dereference:true,filter:(entry)=>{
  const rel=path.relative(source,entry);
  if (!rel) return true;
  if(rel.split(path.sep).some(p=>ignored.has(p))) return false;
  return !transient.test(path.basename(entry)) && !skippedFiles.has(path.basename(entry));
}});
// Relocate generated launchers and configuration, including editable package maps.
// Only this new copy is changed. The source runtime remains usable independently.
let rebased=0;
const textExtensions=new Set(['.py','.pth','.cfg','.json','.yaml','.yml','.ps1','.cmd','.bat','.md','.toml']);
function rebase(dir) {
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()) { if(entry.name!=='.git') rebase(file); continue; }
    if(!entry.isFile() || fs.statSync(file).size>4*1024*1024 || !(textExtensions.has(path.extname(file)) || entry.name==='.env')) continue;
    const original=fs.readFileSync(file,'utf8');
    let next=original;
    for(const [from,to] of [[source,target],[source.replaceAll('\\','/'),target.replaceAll('\\','/')],[source.replaceAll('\\','\\\\'),target.replaceAll('\\','\\\\')]]) next=next.split(from).join(to);
    if(next!==original) {fs.writeFileSync(file,next); rebased++;}
  }
}
rebase(target);
// SQLite's online backup API captures a coherent database even while Hermes is open.
// Configure only the copied home; duplicate inbound channels/schedules start disabled.
const python=path.join(target,'hermes-agent','venv','Scripts','python.exe');
execFileSync(python,['-c',String.raw`
import sqlite3, pathlib, sys, yaml, json, os
source,target=map(pathlib.Path,sys.argv[1:])
count=0
for folder in [source,*(source/'profiles').glob('*')]:
    if not folder.is_dir(): continue
    out=target/folder.relative_to(source); out.mkdir(parents=True,exist_ok=True)
    for dbfile in folder.glob('*.db'):
        with sqlite3.connect(dbfile.as_uri()+'?mode=ro',uri=True,timeout=15) as src:
            with sqlite3.connect(out/dbfile.name) as dst:
                src.backup(dst,pages=500)
        count+=1
    config=out/'config.yaml'
    if config.exists():
        cfg=yaml.safe_load(config.read_text(encoding='utf-8')) or {}
        for name,platform in cfg.get('platforms',{}).items():
            if isinstance(platform,dict): platform['enabled']=name=='api_server'
        api=cfg.setdefault('platforms',{}).setdefault('api_server',{})
        api['enabled']=True; api.setdefault('extra',{}).update({'host':'127.0.0.1','port':18642+count-1})
        if folder==source: api['extra']['port']=18642
        config.write_text(yaml.safe_dump(cfg,sort_keys=False,allow_unicode=True),encoding='utf-8')
    env=out/'.env'
    if env.exists():
        lines=env.read_text(encoding='utf-8').splitlines()
        lines=[line for line in lines if not line.startswith(('API_SERVER_PORT=','API_SERVER_HOST='))]
        env.write_text('\n'.join(lines)+'\nAPI_SERVER_PORT='+str(api['extra']['port'])+'\nAPI_SERVER_HOST=127.0.0.1\n',encoding='utf-8')
print('Consistent database snapshots:',count)
` ,source,target],{cwd:path.join(target,'hermes-agent'),env:{...process.env,HERMES_HOME:target},windowsHide:true,stdio:'inherit',timeout:180000});
// Do not run a second copy of the original scheduler's jobs.
const cron=path.join(target,'cron','jobs.json');
if(fs.existsSync(cron)) {
  fs.copyFileSync(cron,cron+'.migration-original');
  const value=JSON.parse(fs.readFileSync(cron,'utf8'));
  const jobs=Array.isArray(value)?value:Array.isArray(value.jobs)?value.jobs:[];
  for(const job of jobs) {job.enabled=false; job.paused=true;}
  fs.writeFileSync(cron,JSON.stringify(value,null,2));
}
execFileSync(python,['-c',"import pathlib,sys,yaml,dotenv,hermes_cli; assert pathlib.Path(sys.prefix).resolve().is_relative_to(pathlib.Path(sys.argv[1]).resolve()); print('MIGHTY_RUNTIME_OK')",target],{windowsHide:true,stdio:'inherit',cwd:path.join(target,'hermes-agent'),env:{...process.env,HERMES_HOME:target},timeout:30000});
fs.writeFileSync(marker,JSON.stringify({version:1,createdAt:new Date().toISOString(),source,home:target,apiPort:18642,dashboardPort:19642,rebasedFiles:rebased,sourcePreserved:true,inboundChannelsCopiedDisabled:true},null,2));
fs.unlinkSync(pending);
console.log('Mighty owns its local runtime at '+target);
