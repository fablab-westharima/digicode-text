"""Offline archive inspection only; no esptool or device access."""
import sys, json, zipfile, hashlib, struct
from pathlib import Path
root=Path(__file__).resolve().parent.parent
build=root/'compiler/pio-esp32c3/.pio/build/xiao_esp32c3'
with zipfile.ZipFile(sys.argv[1]) as archive:
    assert len(archive.namelist()) == len(set(archive.namelist())) == 6
    assert set(archive.namelist()) == {'bootloader.bin','partitions.bin','boot_app0.bin','firmware.bin','manifest.json','README.txt'}
    manifest=json.loads(archive.read('manifest.json'))
    assert manifest['board']=='seeed_xiao_esp32c3' and manifest['chip']=='esp32c3'
    assert manifest['platform']=='espressif32@7.0.1'
    assert [x['address'] for x in manifest['images']]==['0x0','0x8000','0xe000','0x10000']
    assert len(manifest['images']) == 4
    previous_end = 0
    for entry in manifest['images']:
        name=entry['file']; data=archive.read(name)
        address = int(entry['address'], 0)
        assert address >= previous_end and address + len(data) <= 4*1024*1024
        previous_end = address + len(data)
        assert len(data)==entry['size'] and hashlib.sha256(data).hexdigest()==entry['sha256']
        path=Path.home()/'.platformio/packages/framework-arduinoespressif32/tools/partitions/boot_app0.bin' if name=='boot_app0.bin' else build/name
        assert data==path.read_bytes()
        assert b'/Users/' not in data and str(root).encode() not in data
        if name in ['firmware.bin','bootloader.bin']:
            assert data[0]==0xe9 and struct.unpack_from('<H',data,12)[0]==5 # ESP32-C3 image chip id
    partitions=archive.read('partitions.bin')
    app=[]
    for pos in range(0,len(partitions),32):
        if partitions[pos:pos+2]!=b'\xaa\x50': break
        magic,kind,subtype,offset,size,label,flags=struct.unpack_from('<HBBII16sI',partitions,pos)
        if kind==0: app.append((offset,size))
    assert app[0][0]==0x10000 and len(archive.read('firmware.bin'))<=app[0][1]
    for name in ['manifest.json','README.txt']:
        assert b'/Users/' not in archive.read(name)
    print(json.dumps({'images':manifest['images'],'flashMode':manifest['flashMode'],'flashFrequency':manifest['flashFrequency'],'flashSize':manifest['flashSize']}))
