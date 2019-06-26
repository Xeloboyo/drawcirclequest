import os
import random
import sys
import time

import discord
import wow
from discord.ext import commands
from discord.ext.commands import Bot

TOKENEN = b'NjEPXS8rOF13Z1QEfk1uQ351Vwx4cFUHGG5kcwYOZR5jUHYYfEBvf3xoeHMEZQEDUUBFZXxjdX9teAk='


def xor_crypt_string(data, key='awesomepassword', encode=False, decode=False):
    from itertools import cycle
    import base64
    if decode:
        data = base64.b64decode(data)
    xored = ''.join(chr(a ^ ord(b)) for (a, b) in zip(data, cycle(key)))
    if encode:
        return base64.b64encode(xored.encode()).strip()
    return xored


TOKEN = "NTd16K5w0RDlM4OjwoipdjIOWD-AJdowaidjoawjdiojdioaw {pass: botDecryp}"
try:  # serverside
    TOKEN = os.environ['DISCORD']
except:  # local testing
    decryptkey = sys.argv[1]
    random.seed(decryptkey)

    while len(decryptkey) < len(TOKENEN):
        decryptkey += str(random.randint(0, 9))
    TOKEN = xor_crypt_string(TOKENEN, decryptkey, False, True)
    print(TOKEN)

client = discord.Client()
commandprefix = "$$"

client = Bot(command_prefix=commandprefix)


def randomSTR(size):
    accessToken = ""
    for i in range(0, size):
        accessToken += chr(random.randint(ord('a'), ord('z')))
    return accessToken


@client.command()
async def suicide(ctx):
    await client.logout()


@client.command()
async def genkey(ctx):
    token = randomSTR(10)

    wow.sendToDB("DCt0k3n" + token, time.time())
    wow.r.expire("DCt0k3n" + token, 3600 * 6)
    await ctx.author.send(
        "Your new token is:" + token + "\n    Login at https://draw-circle-quest.herokuapp.com/register")


@client.command()
async def getUserCount(ctx):
    await ctx.send("No. Users Online:" + str(len(wow.getFromDB("USERS").split())))


@client.command()
async def getRedisUsage(ctx):
    await ctx.send(str(wow.r.execute_command("MEMORY STATS")))


@client.command()
async def getUsers(ctx):
    await ctx.send("Users Online:" + wow.getFromDB("USERS"))


@client.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.CommandNotFound):
        await ctx.send("Message not recognised, please try again.")
        return
    await ctx.send("Error:" + str(error))


@client.event
async def on_ready():
    print('Logged in as')
    print(client.user.name)
    print(client.user.id)
    print('------')


# client.run(TOKEN)
client.run(TOKEN)
