"""Offline flash-set inspection only; no esptool or device access."""
import sys, json, hashlib, struct, base64
from pathlib import Path
root=Path(__file__).resolve().parent.parent
manifest=json.loads(Path(sys.argv[1]).read_text())
assert manifest['format']=='digicode-text-flash-set' and manifest['version']==2
assert manifest['board']=='seeed_xiao_esp32c3' and manifest['chip']=='esp32c3'
assert manifest['platform']=='espressif32@55.03.312' # pioarduino's platform, pinned in compiler/pio-esp32c3/platformio.ini
assert [x['address'] for x in manifest['images']]==['0x0','0x8000','0xe000','0x10000']
assert [x['file'] for x in manifest['images']]==['bootloader.bin','partitions.bin','boot_app0.bin','firmware.bin']
images={}
previous_end = 0
for entry in manifest['images']:
    name=entry['file']; data=base64.b64decode(entry['data'], validate=True); images[name]=data
    address = int(entry['address'], 0)
    assert address >= previous_end and address + len(data) <= 4*1024*1024
    previous_end = address + len(data)
    assert len(data)==entry['size'] and hashlib.sha256(data).hexdigest()==entry['sha256']
    # Build workspaces are ephemeral; verify the set against its own manifest.
    assert b'/Users/' not in data and str(root).encode() not in data
    if name in ['firmware.bin','bootloader.bin']:
        assert data[0]==0xe9 and struct.unpack_from('<H',data,12)[0]==5 # ESP32-C3 image chip id
partitions=images['partitions.bin']
app=[]
for pos in range(0,len(partitions),32):
    if partitions[pos:pos+2]!=b'\xaa\x50': break
    magic,kind,subtype,offset,size,label,flags=struct.unpack_from('<HBBII16sI',partitions,pos)
    if kind==0: app.append((offset,size))
assert app[0][0]==0x10000 and len(images['firmware.bin'])<=app[0][1]
assert '/Users/' not in json.dumps({k:v for k,v in manifest.items() if k!='images'})
print(json.dumps({'images':[{k:v for k,v in x.items() if k!='data'} for x in manifest['images']],'flashMode':manifest['flashMode'],'flashFrequency':manifest['flashFrequency'],'flashSize':manifest['flashSize']}))
