const connectionReady = (cb = () =>{}) => {
    console.log('Robô está escutando o chat')
    console.log('🔴 Escreva: !teste');
    cb()
}

const connectionLost = (cb = () =>{}) => {
    console.log('** Erro de autenticação para gerar o QRCODE novamente (delete o pasta session-bot-MFA) **');
    cb()
}


module.exports = {connectionReady, connectionLost}