# This script watches gta-vc.exe memory and splits when missions passed increases
# You still need manual reset and start

from time import sleep
from ctypes import *
from struct import *
import subprocess
import re
pid = ''

print 'Waiting for gta-vc.exe'
while pid == '':
	tl = subprocess.Popen(['tasklist', '/NH', '/FI', 'IMAGENAME eq gta-vc.exe'], stdout=subprocess.PIPE).communicate()[0]
	pid = re.findall('[^\d]*([^ ]*)',tl)[0]
	sleep(1)
print 'gta-vc.exe pid found'

f = open(r'\\.\pipe\nwsplit', 'w', 0)
op = windll.kernel32.OpenProcess
rpm = windll.kernel32.ReadProcessMemory
ch = windll.kernel32.CloseHandle
PAA = 0x1F0FFF
addy = 0x00A0C22C
ph = op(PAA,False,int(pid))
lastmission = 0

def read(addr):
	datadummy = b'.'*4
	buff = c_char_p(datadummy)
	bufferSize = (len(buff.value))
	bytesRead = c_ulong(0)
	if rpm(ph,addr,buff,bufferSize,byref(bytesRead)):
		value = unpack('I',datadummy)[0]
		return value

while True:
	mission = read(0x00A0C22C)
	if lastmission != mission:
		print 'Mission passed: %s' % mission
		f.write('split()\n')
		f.flush()
		lastmission = mission
	sleep(.01)