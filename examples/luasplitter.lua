-- This is an example on how you can use the ipc socket to autosplit any game in BizHawk with lua scripts
-- You just need to know the memory addresses to watch
-- I use it when playing mario because pressing a button to split is so frustrating

-- First we open the pipe nwsplit has created for us
f = io.open('\\\\.\\pipe\\nwsplit','w')
function cmd (msg)
	f:write(msg .. '\n')
	f:flush()
end

-- if you want to generate splits you should probably turn autoadd on for the first run
-- cmd('options.autoadd = true')
-- while we're at it lets set the game title and attempt count
-- cmd('options.title = "SMB3 Any%"; options.attempts = 0')
-- heck you could even put on a tas and get some coffee

-- Define some memory addresses for mario
commands = {
	{ cmd = 'split()'; cond = { [0x04F2] = 1; [0x0100] = 0x20 } }; -- coin sound + start menu, lets start! I mean lets-a-go!
	{ cmd = 'split()'; cond = { [0x0014] = 1; } }; -- return to map. this also fires on death but we fix it with undo()
	{ cmd = 'split(); stop()'; cond = { [0x04F5] = 0xF; } }; -- peach music, we done! this is probably 1 second late...
	{ cmd = 'reset()'; cond = { [0x00F5] = 0xFF; } }; -- everything is set to FF on hard reset, this is the controller status so it probably cant be FF normally
	-- while we are demonstrating shit, lets add a death counter in two lines
	{ cmd = 'undo(); custom.find("span").html(1+1*custom.find("span").html())'; cond = { [0x04F4] = 1; } }; -- death sound bank
	-- (undo does break if you die on first split, but you would reset anyway right?)
}
cmd('custom.html("Deaths: <span contenteditable=\'true\'>0</span>")')
cmd('reset()')

-- then just loop the addresses and run commands if we find the right values in ram
count = 0
while true do
	if(emu.framecount() - count > 60) then
		for key,command in pairs(commands) do
			execute = true
    		for addr,value in pairs(command.cond) do
    			if(memory.readbyte(addr) ~= value) then
    				execute = false
    			end
    		end
    		if(execute) then
    			cmd(command.cmd)
    			count = emu.framecount()
    		end
		end
	end
	emu.frameadvance()
end