"""Offline flash-set inspection only; no esptool or device access."""
import sys, json, hashlib, base64
from pathlib import Path
root=Path(__file__).resolve().parent.parent
manifest=json.loads(Path(sys.argv[1]).read_text())
assert manifest['format']=='digicode-text-flash-set' and manifest['version']==2
assert manifest['board']=='wio_node' and manifest['chip']=='esp8266'
assert manifest['platform']=='espressif8266@4.2.1'
# ESP8266 flashes one image: the eboot bootloader and the application in a single binary at 0x0.
assert [x['address'] for x in manifest['images']]==['0x0']
assert [x['file'] for x in manifest['images']]==['firmware.bin']
previous_end = 0
for entry in manifest['images']:
    data=base64.b64decode(entry['data'], validate=True)
    address = int(entry['address'], 0)
    assert address >= previous_end and address + len(data) <= 4*1024*1024
    previous_end = address + len(data)
    assert len(data)==entry['size'] and hashlib.sha256(data).hexdigest()==entry['sha256']
    # Build workspaces are ephemeral; verify the set against its own manifest.
    assert b'/Users/' not in data and str(root).encode() not in data
    assert data[0]==0xe9 # ESP8266 image magic
assert '/Users/' not in json.dumps({k:v for k,v in manifest.items() if k!='images'})
print(json.dumps({'images':[{k:v for k,v in x.items() if k!='data'} for x in manifest['images']],'flashMode':manifest['flashMode'],'flashFrequency':manifest['flashFrequency'],'flashSize':manifest['flashSize']}))
