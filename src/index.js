const fs = require('fs')
const path = require('path')
const { Telegraf } = require('telegraf');

const pino = require('pino')

const log = console.log
const print = pino()
c1onst TOKEN = '6362043785:AAFIE00znnGeb7IyWuVZxYqGBiRh-uGD3S8'

const bot = new Telegraf(TOKEN)
const DBPath = __dirname + '/DB.json'

function getShkolota() {
    return JSON.parse(fs.readFileSync(DBPath, "utf8", (e, data) => data))
}
function setShkolota(data) {
    fs.writeFileSync(DBPath, data, "utf-8")
    return true
}
let slave = null
let {shkolota} = getShkolota()
shkolota = shkolota.sort()
bot.start((ctx) => ctx.reply('Welcome'))

bot.command('shkolota', ctx => {
    const chatId = ctx.message.chat.id
    const list = ["Список беброчек:"]
    const otrabotkaList = ["Список отработавших беброчек:"]
    const {otrabotka} = getShkolota() 

    for (let i = 1; i <= shkolota.length; i++){
        const person = shkolota[i - 1] 
        list.push(`${i < 10 ? '  ' + i : i}. ${person}`)
        
        if (otrabotka.length !== 0 && i <= otrabotka.length) {
            const person = otrabotka[i - 1]
            otrabotkaList.push(`${i < 10 ? '  '+i : i}. ${person}`)
        }
        
    }
    
    ctx.telegram.sendMessage(chatId, otrabotkaList.join('\n'))
    ctx.telegram.sendMessage(chatId, list.join('\n'))
})
// УМИРАЕТ ОТ КОЛИЧЕСТВА КОММАНД В ЧАТЕ
bot.command("cleaner", async ctx => {
    const chatId = ctx.message.chat.id
    const brokeTime = 60000;
    if (Date.now() - ctx.message.date * 1000 > brokeTime) return print.error("Еба")
    const { otrabotka } = getShkolota()
    if (shkolota.length <= otrabotka.length) {
        return ctx.telegram.sendMessage(
            chatId,
            "Пропиши /wipe, ибо не осталось рабочих рук"
        )
    }
    function getCleaner() {
        while (true) {
            const rand = Math.floor(Math.random() * shkolota.length);
            const cleaner = shkolota[rand]
            
            if (otrabotka.length === 0 || !otrabotka.includes(cleaner)) {
                return cleaner;
            }
        }
    }
    const cleaner = getCleaner()
    try {
        ctx.telegram.sendMessage(chatId, `Доску моет этот чел: \n- ${cleaner}`)
    } catch (err) {
        print.error(err.message)
    }
    print.info(`Доску моет этот чел: \n- ${cleaner}`)
    slave = cleaner
})
bot.command("otrabotal", async ctx => {
    const chatId = ctx.message.chat.id
    if (!slave) return ctx.telegram.sendMessage(chatId, 'А кто-то работал?') 

    const { otrabotka } = getShkolota()
    otrabotka.push(slave)
    const data = JSON.stringify({
        shkolota,
        otrabotka
    })
    setShkolota(data)
    ctx.telegram.sendMessage(chatId, `${slave} - занесён в список отработавших`)
})
bot.command("wipe", async ctx => {
    const chatId = ctx.message.chat.id
    const { otrabotal } = getShkolota()
    if(otrabotal.length === 0) return
    const data = JSON.stringify({
        shkolota,
        otrabotka: []
    })
    setShkolota(data)
    ctx.telegram.sendMessage(chatId, `Вы снесли базу)`)
})
bot.launch()
print.info("Bot started!")
                            
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))