// Seleciona os elementos do DOM
const qrCodeContainer = document.getElementById('qrcode-container');
const saidaContainer = document.getElementById('saida-container');
const placaInput = document.getElementById('placa');
const qrcodeInput = document.getElementById('qrcode');

// Armazena o horário de entrada no localStorage
function storeEntryTime(placa) {
    const entryTime = new Date().toISOString();
    localStorage.setItem(`entryTime_${placa}`, entryTime);
}

// Recupera o horário de entrada do localStorage
function getEntryTime(placa) {
    const entryTime = localStorage.getItem(`entryTime_${placa}`);
    return entryTime ? new Date(entryTime) : null;
}

// Funções para gerar e ler QR code
function generateQRCode(placa) {
    storeEntryTime(placa);
    qrCodeContainer.innerHTML = ''; // Limpa o contêiner antes de gerar um novo QR Code
    new QRCode(qrCodeContainer, {
        text: placa,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

function extractPlacaFromQRCode(qrcodeData) {
    const image = new Image();
    image.src = qrcodeData;

    return new Promise((resolve, reject) => {
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0, canvas.width, canvas.height);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const decoded = jsQR(imageData.data, imageData.width, imageData.height);

            if (decoded) {
                resolve(decoded.data);
            } else {
                reject('Falha na decodificação do QR Code');
            }
        };
    });
}

// Funções para calcular tempo de permanência e valor a cobrar
function calculateTempoDePermanencia(entrada, saida) {
    const tempoDePermanenciaEmMinutos = (saida - entrada) / 60000;
    return tempoDePermanenciaEmMinutos;
}

function calculateValorACobrar(tempoDePermanenciaEmMinutos) {
    const tarifaPorHora = 8.00; // R$
    const tempoDePermanenciaEmHoras = tempoDePermanenciaEmMinutos / 60;
    const valorACobrar = tarifaPorHora * tempoDePermanenciaEmHoras;
    return valorACobrar.toFixed(2);
}

// Event listeners
document.getElementById('gerar-qrcode').addEventListener('click', () => {
    const placa = placaInput.value;
    if (placa) {
        generateQRCode(placa);
    } else {
        alert('Por favor, insira a placa do veículo.');
    }
});

document.getElementById('verificar-qrcode').addEventListener('click', () => {
    const qrcodeFile = qrcodeInput.files[0];
    const qrcodeReader = new FileReader();
    qrcodeReader.onload = async () => {
        const qrcodeData = qrcodeReader.result;
        try {
            const placa = await extractPlacaFromQRCode(qrcodeData);
            const entrada = getEntryTime(placa); // hora de entrada real
            if (entrada) {
                const saida = new Date(); // hora de saída (atual)
                const tempoDePermanenciaEmMinutos = calculateTempoDePermanencia(entrada, saida);
                const valorACobrar = calculateValorACobrar(tempoDePermanenciaEmMinutos);
                saidaContainer.innerHTML = `Você permaneceu ${tempoDePermanenciaEmMinutos} minutos no estacionamento. O valor a cobrar é R$ ${valorACobrar}.`;
            } else {
                saidaContainer.innerHTML = 'Erro: horário de entrada não encontrado.';
            }
        } catch (error) {
            console.error(error);
            saidaContainer.innerHTML = 'Erro ao verificar QR Code.';
        }
    };
    if (qrcodeFile) {
        qrcodeReader.readAsDataURL(qrcodeFile);
    } else {
        alert('Por favor, selecione um arquivo de QR Code.');
    }
});
