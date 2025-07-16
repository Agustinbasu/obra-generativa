let imagenTrazoPrincipal;
let imagenesSombra = [];
const cantidadImagenesSombra = 5;
let imagenesFondo = [];
let fondoActual;
const cantidadFondos = 4;
let listaTrazosNormales = [];
let listaTrazosSombras = [];
let listaTrazosConSombra = []; 
let lienzoDibujo;
let lienzoSombras; 
let contadorTrazos = 0;
let contadorTrazosDiagonales = 0;
const limiteTrazosDiagonales = 5;
let ultimaOrientacionSombra = 'vertical';
let trazosSombraGenerados = 0;
const limiteTrazosSombra = 2;
let offsetSombra = 0; 
let margenVerticalXMin, margenVerticalXMax;
let margenHorizontalYMin, margenHorizontalYMax;
let puntoReferenciaX, puntoReferenciaY;
let microfono;
let analizadorFFT;
let analizadorAmplitud;
let audioListo = false;
let tiempoInicioSonido = 0;
let umbralDuracionSonido = 1000;
let sonidoSostenido = false;
let ultimoTiempoTrazo = 0;
let intervaloMinimoTrazo = 500;
let estadoMicrofonoDiv;
let grosorUltimoTrazo = 200;
let orientacionUltimoTrazo = 'vertical';
let ultimoTrazoGenerado = null; 

function preload() {
    imagenTrazoPrincipal = loadImage('data/trazoprincipal/trazo.png');
    for (let i = 0; i < cantidadImagenesSombra; i++) {
        imagenesSombra[i] = loadImage(`data/trazossombra/trazo_sombra_${i + 1}.png`);
    }
    for (let i = 0; i < cantidadFondos; i++) {
        imagenesFondo[i] = loadImage(`data/fondos/fondo0${i + 1}.jpg`);
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    lienzoDibujo = createGraphics(windowWidth, windowHeight);
    lienzoDibujo.imageMode(CENTER);
    lienzoSombras = createGraphics(windowWidth, windowHeight);
    lienzoSombras.imageMode(CENTER);
    lienzoSombras.clear(); 
    if (imagenTrazoPrincipal) procesarImagenTrazoPrincipal(imagenTrazoPrincipal);
    for (let i = 0; i < cantidadImagenesSombra; i++) {
        if (imagenesSombra[i]) procesarImagenesSombra(imagenesSombra[i]);
    }
    seleccionarFondoAleatorio();
    if (fondoActual) {
        lienzoDibujo.image(fondoActual, width / 2, height / 2, width, height);
    } else {
        lienzoDibujo.background(255);
    }
    configurarMargenes();
    configurarAudio();
    crearInterfaz();
}

function configurarAudio() {
    microfono = new p5.AudioIn();
    analizadorFFT = new p5.FFT();
    analizadorAmplitud = new p5.Amplitude();
}

function crearInterfaz() {
    estadoMicrofonoDiv = createDiv('Micrófono: HACÉ CLIC Y HABLÁ PARA EMPEZAR');
    estadoMicrofonoDiv.style('position', 'absolute');
    estadoMicrofonoDiv.style('top', '10px');
    estadoMicrofonoDiv.style('left', '10px');
    estadoMicrofonoDiv.style('color', 'black');
    estadoMicrofonoDiv.style('font-family', 'Arial, sans-serif');
    estadoMicrofonoDiv.style('background-color', 'rgba(255, 255, 255, 0.8)');
    estadoMicrofonoDiv.style('padding', '8px 12px');
    estadoMicrofonoDiv.style('border-radius', '5px');
}

function mousePressed() {
    if (getAudioContext().state !== 'running') {
        userStartAudio();
        microfono.start(() => {
            analizadorFFT.setInput(microfono);
            analizadorAmplitud.setInput(microfono);
            audioListo = true;
            estadoMicrofonoDiv.html('Micrófono: ACTIVO');
        }, () => {
            estadoMicrofonoDiv.html('Micrófono: ERROR');
            audioListo = false;
        });
    }
}

function draw() {
    if (!audioListo || getAudioContext().state !== 'running') {
        mostrarMensajeInicial();
        return;
    }
    analizarAudio();
    actualizarTrazos();
    dibujarEscena();
}

function mostrarMensajeInicial() {
    fill(0);
    textSize(20);
    textAlign(CENTER, CENTER);
    text("Haz clic para activar el micrófono y comenzar la obra", width / 2, height / 2);
    image(lienzoDibujo, 0, 0);
}

function analizarAudio() {
    analizadorFFT.analyze();
    let nivelVolumen = analizadorAmplitud.getLevel();
    let centroideEspectral = analizadorFFT.getCentroid();
    let umbralSonido = 0.01;
    if (nivelVolumen > umbralSonido) {
        manejarSonidoDetectado(nivelVolumen, centroideEspectral);
    } else {
        manejarSilencio();
    }
}

function manejarSonidoDetectado(nivelVolumen, centroideEspectral) {
    if (tiempoInicioSonido === 0) {
        tiempoInicioSonido = millis();
        sonidoSostenido = false;
    } else {
        let duracionActual = millis() - tiempoInicioSonido;
        if (duracionActual > umbralDuracionSonido && !sonidoSostenido) {
            sonidoSostenido = true;
            reiniciarObra();
            estadoMicrofonoDiv.html('Micrófono: REINICIANDO');
        }
    }
    if (!sonidoSostenido && (millis() - ultimoTiempoTrazo > intervaloMinimoTrazo)) {
        generarTrazos(nivelVolumen, centroideEspectral);
    }
}

function generarTrazos(nivelVolumen, centroideEspectral) {
    let anchoTrazoActual = map(nivelVolumen, 0.01, 0.08, 50, 400);
    let direccionTrazoActual = (centroideEspectral < 2800) ? 'horizontal' : 'vertical';
    grosorUltimoTrazo = anchoTrazoActual;
    orientacionUltimoTrazo = direccionTrazoActual;
    let trazoCompleto = random() < 0.6;
    let nuevoTrazo = new Trazo(direccionTrazoActual, false, anchoTrazoActual, trazoCompleto);
    listaTrazosNormales.push(nuevoTrazo);
    ultimoTrazoGenerado = nuevoTrazo; 
    contadorTrazos++;
    ultimoTiempoTrazo = millis();
    estadoMicrofonoDiv.html(`Micrófono: ACTIVO - Trazo ${direccionTrazoActual.toUpperCase()}`);
    if (contadorTrazos % 3 === 0 && contadorTrazosDiagonales < limiteTrazosDiagonales) {
        let trazoCompletoD = random() < 0.5;
        let grosorDiagonal = random(120, 350);
        grosorUltimoTrazo = grosorDiagonal;
        orientacionUltimoTrazo = 'diagonal';
        let trazoDiagonal = new Trazo('diagonal', false, grosorDiagonal, trazoCompletoD);
        listaTrazosNormales.push(trazoDiagonal);
        ultimoTrazoGenerado = trazoDiagonal; 
        contadorTrazosDiagonales++;
    }
    if (contadorTrazos % 2 === 0 && trazosSombraGenerados < limiteTrazosSombra) {
        generarSombra();
    }
}

function generarSombra() {
    if (!ultimoTrazoGenerado) return;
    ultimaOrientacionSombra = (ultimaOrientacionSombra === 'vertical') ? 'horizontal' : 'vertical';
    let grosorSombra = min(grosorUltimoTrazo * 0.7, 150);
    let sombra = new Trazo('sombra', true, grosorSombra, true, ultimaOrientacionSombra, 0, ultimoTrazoGenerado);
    listaTrazosSombras.push(sombra);
    ultimoTrazoGenerado.tieneSombra = true;
    let indiceTrazo = listaTrazosNormales.indexOf(ultimoTrazoGenerado);
    if (indiceTrazo !== -1) {
        listaTrazosNormales.splice(indiceTrazo, 1);
        listaTrazosConSombra.push(ultimoTrazoGenerado);
    }
    trazosSombraGenerados++;
}

function manejarSilencio() {
    tiempoInicioSonido = 0;
    sonidoSostenido = false;
    estadoMicrofonoDiv.html('Micrófono: ESCUCHANDO...');
}

function actualizarTrazos() {
    listaTrazosNormales = listaTrazosNormales.filter(trazo => trazo.estaEnPantalla());
    listaTrazosConSombra = listaTrazosConSombra.filter(trazo => trazo.estaEnPantalla());
    listaTrazosSombras = listaTrazosSombras.filter(sombra => {
        if (sombra.trazoPadre) {
            return listaTrazosNormales.includes(sombra.trazoPadre) || 
                   listaTrazosConSombra.includes(sombra.trazoPadre);
        }
        return true;
    });
    for (let trazo of listaTrazosNormales) {
        trazo.mover();
    }
    for (let trazo of listaTrazosConSombra) {
        trazo.mover();
    }
    for (let sombra of listaTrazosSombras) {
        sombra.mover();
    }
}

function dibujarEscena() {
    for (let trazo of listaTrazosNormales) {
        trazo.dibujar(lienzoDibujo);
    }
    for (let trazo of listaTrazosConSombra) {
        trazo.dibujar(lienzoDibujo);
    }
    for (let sombra of listaTrazosSombras) {
        sombra.dibujar(lienzoSombras);
    }
    image(lienzoDibujo, 0, 0);
    image(lienzoSombras, 0, 0);
}

function procesarImagenTrazoPrincipal(imagen) {
    imagen.loadPixels();
    for (let i = 0; i < imagen.pixels.length; i += 4) {
        let r = imagen.pixels[i];
        let g = imagen.pixels[i + 1];
        let b = imagen.pixels[i + 2];
        if (r + g + b > 25) {
            imagen.pixels[i + 3] = 0;
        }
    }
    imagen.updatePixels();
}

function procesarImagenesSombra(imagen) {
    imagen.loadPixels();
    for (let i = 0; i < imagen.pixels.length; i += 4) {
        let r = imagen.pixels[i];
        let g = imagen.pixels[i + 1];
        let b = imagen.pixels[i + 2];
        if (r + g + b > 250) {
            imagen.pixels[i + 3] = 0;
        }
    }
    imagen.updatePixels();
}

function seleccionarFondoAleatorio() {
    if (imagenesFondo.length > 0) {
        fondoActual = random(imagenesFondo);
    }
}

function configurarMargenes() {
    puntoReferenciaX = random(0, width);
    puntoReferenciaY = random(0, height);
    margenVerticalXMin = random(max(0, puntoReferenciaX - width / 4), puntoReferenciaX);
    margenVerticalXMax = random(puntoReferenciaX, min(width, puntoReferenciaX + width / 4));
    if (margenVerticalXMin > margenVerticalXMax) {
        [margenVerticalXMin, margenVerticalXMax] = [margenVerticalXMax, margenVerticalXMin];
    }
    margenHorizontalYMin = random(max(0, puntoReferenciaY - height / 4), puntoReferenciaY);
    margenHorizontalYMax = random(puntoReferenciaY, min(height, puntoReferenciaY + height / 4));
    if (margenHorizontalYMin > margenHorizontalYMax) {
        [margenHorizontalYMin, margenHorizontalYMax] = [margenHorizontalYMax, margenHorizontalYMin];
    }
}

function reiniciarObra() {
    listaTrazosNormales = [];
    listaTrazosSombras = [];
    listaTrazosConSombra = [];
    contadorTrazos = 0;
    contadorTrazosDiagonales = 0;
    trazosSombraGenerados = 0;
    ultimaOrientacionSombra = 'vertical';
    grosorUltimoTrazo = 200;
    orientacionUltimoTrazo = 'vertical';
    ultimoTrazoGenerado = null;
    lienzoSombras.clear();
    configurarMargenes();
    seleccionarFondoAleatorio();
    if (fondoActual) {
        lienzoDibujo.image(fondoActual, width / 2, height / 2, width, height);
    } else {
        lienzoDibujo.background(255);
    }
    estadoMicrofonoDiv.html('Micrófono: REINICIADO');
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    lienzoDibujo = createGraphics(windowWidth, windowHeight);
    lienzoDibujo.imageMode(CENTER);
    lienzoSombras = createGraphics(windowWidth, windowHeight);
    lienzoSombras.imageMode(CENTER);
    lienzoSombras.clear();
    
    if (fondoActual) {
        lienzoDibujo.image(fondoActual, width / 2, height / 2, width, height);
    } else {
        lienzoDibujo.background(255);
    }
    
    configurarMargenes();
}

