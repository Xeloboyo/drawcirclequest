import random
import time

import discord
import wow
from discord.ext import commands
from discord.ext.commands import Bot

TOKEN = "NTc2MDA2NTg1NzYwMDg4MDg1.XNQOFg.TmubKCPbHjYaXPPAUXHpM9cLAtk"
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
    await ctx.send("Your new token is:"+token+"\n    Login at https://draw-circle-quest.herokuapp.com/register")

@client.command()
async def getUserCount(ctx):
    await ctx.send("No. Users Online:"+str(len(wow.userlist)))


@client.command()
async def getRedisUsage(ctx):
    await ctx.send(str(wow.r.memory_usage()))

@client.command()
async def getUsers(ctx):
    str = ""
    for user in wow.userlist:
        str += user.name+","
    await ctx.send("Users Online:"+str)

@client.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.CommandNotFound):
        await ctx.send("Message not recognised, please try again.")


@client.event
async def on_ready():
    print('Logged in as')
    print(client.user.name)
    print(client.user.id)
    print('------')

#client.run(TOKEN)
client.run(TOKEN)

