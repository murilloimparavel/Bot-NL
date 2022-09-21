const connectionReady = (cb = () =>{}) => {
    console.log('Robô está escutando o chat')
    console.log('Client is ready!');
    console.log('🔴 Escreva: Olá');
    cb()
}

const connectionLost = (cb = () =>{}) => {
    console.log('** Error de autentificacion vuelve a generar el QRCODE (Borrar el archivo session.json) **');
    cb()
}


module.exports = {connectionReady, connectionLost}