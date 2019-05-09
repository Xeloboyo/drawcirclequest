import random

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
async def genkey(ctx):
    token = "DCt0k3n" + randomSTR(10);
    wow.sendToDB(token, "")
    await ctx.send("Your new token is:"+token)


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

client.run(TOKEN)
#def run():
#    client.run(TOKEN)

