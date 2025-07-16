class Trazo {
    constructor(direccion, esImagenSombra = false, grosor = 100, trazoCompleto = true, orientacionSombra = '', largoSombra = 0, trazoPadre = null) {
        this.direccion = direccion;
        this.esImagenSombra = esImagenSombra;
        this.orientacionSombra = orientacionSombra;
        this.trazoCompleto = trazoCompleto;
        this.distanciaRecorrida = 0;
        this.distanciaMaxima = 0;
        this.trazoPadre = trazoPadre; 
        this.tieneSombra = false; 
        this.configurarPropiedades(grosor, largoSombra);
        this.configurarPosicion();
        this.configurarMovimiento();
    }
    
    configurarPropiedades(grosor, largoSombra) {
        if (this.esImagenSombra) {
            this.imagenTrazo = random(imagenesSombra);
            this.configurarSombra(grosor, largoSombra);
        } else {
            this.imagenTrazo = imagenTrazoPrincipal;
            this.ancho = grosor;
            this.alto = map(this.ancho, 50, 400, 50, 200);
            this.velocidad = random(1.5, 3.5);
        }
    }
    
    configurarSombra(grosor, largoSombra) {
        if (this.trazoPadre) {
            this.ancho = this.trazoPadre.ancho * 0.8; 
            this.alto = this.trazoPadre.alto * 0.8;
        } else {
            this.ancho = grosor;
            this.alto = grosor;
        }
        this.velocidad = 0;
        this.necesitaRotacion = false;
    }
    
    configurarPosicion() {
        if (this.esImagenSombra) {
            this.configurarPosicionSombra();
        } else {
            this.configurarPosicionTrazo();
        }
    }
    
    configurarPosicionSombra() {
        if (this.trazoPadre) {
            this.posicionX = this.trazoPadre.posicionX + offsetSombra;
            this.posicionY = this.trazoPadre.posicionY + offsetSombra;
        } else {
            if (this.orientacionSombra === 'horizontal') {
                this.posicionY = random(margenHorizontalYMin, margenHorizontalYMax);
                this.posicionX = random(this.ancho / 2, width - this.ancho / 2);
            } else {
                this.posicionX = random(margenVerticalXMin, margenVerticalXMax);
                this.posicionY = random(this.alto / 2, height - this.alto / 2);
            }
        }
    }
    
    configurarPosicionTrazo() {
        if (this.direccion === 'vertical') {
            this.posicionX = random(margenVerticalXMin, margenVerticalXMax);
            this.posicionY = -this.alto / 2;
        } else if (this.direccion === 'horizontal') {
            this.posicionY = random(margenHorizontalYMin, margenHorizontalYMax);
            this.posicionX = -this.ancho / 2;
        } else if (this.direccion === 'diagonal') {
            this.configurarPosicionDiagonal();
        }
        if (!this.trazoCompleto) {
            this.configurarDistanciaMaxima();
        }
    }
    
    configurarPosicionDiagonal() {
        let bordeInicio = floor(random(4));
        if (bordeInicio === 0) {
            this.posicionX = random(width);
            this.posicionY = -this.alto / 2;
            this.anguloMovimiento = random(PI * 0.25, PI * 0.75);
        } else if (bordeInicio === 1) {
            this.posicionX = width + this.ancho / 2;
            this.posicionY = random(height);
            this.anguloMovimiento = random(PI * 0.75, PI * 1.25);
        } else if (bordeInicio === 2) {
            this.posicionX = random(width);
            this.posicionY = height + this.alto / 2;
            this.anguloMovimiento = random(PI * 1.25, PI * 1.75);
        } else {
            this.posicionX = -this.ancho / 2;
            this.posicionY = random(height);
            this.anguloMovimiento = random(-PI * 0.25, PI * 0.25);
            if (this.anguloMovimiento < 0) this.anguloMovimiento += TWO_PI;
        }
        this.velocidad = random(2, 4);
    }
    
    configurarDistanciaMaxima() {
        if (this.direccion === 'vertical') {
            this.distanciaMaxima = random(height * 0.3, height * 0.8);
        } else if (this.direccion === 'horizontal') {
            this.distanciaMaxima = random(width * 0.3, width * 0.8);
        } else if (this.direccion === 'diagonal') {
            this.distanciaMaxima = random(min(width, height) * 0.3, min(width, height) * 0.8);
        }
    }
    
    configurarMovimiento() {
    }
    
    mover() {
        if (this.esImagenSombra) {
            if (this.trazoPadre) {
                this.posicionX = this.trazoPadre.posicionX + offsetSombra;
                this.posicionY = this.trazoPadre.posicionY + offsetSombra;
            }
            return;
        }
        if (!this.trazoCompleto && this.distanciaRecorrida >= this.distanciaMaxima) {
            this.velocidad = 0;
            return;
        }
        if (this.direccion === 'vertical') {
            this.posicionY += this.velocidad;
            this.distanciaRecorrida += this.velocidad;
        } else if (this.direccion === 'horizontal') {
            this.posicionX += this.velocidad;
            this.distanciaRecorrida += this.velocidad;
        } else if (this.direccion === 'diagonal') {
            this.moverDiagonal();
        }
    }
    
    moverDiagonal() {
        let deltaX = this.velocidad * cos(this.anguloMovimiento);
        let deltaY = this.velocidad * sin(this.anguloMovimiento);
        this.posicionX += deltaX;
        this.posicionY += deltaY;
        this.distanciaRecorrida += sqrt(deltaX * deltaX + deltaY * deltaY);
    }
    
    dibujar(lienzoPG) {
        lienzoPG.push();
        lienzoPG.translate(this.posicionX, this.posicionY);
        if (!this.esImagenSombra && this.direccion === 'vertical') {
            lienzoPG.rotate(PI / 2);
        }
        if (this.esImagenSombra && this.direccion === 'horizontal') {
            lienzoPG.rotate(PI / 2);
        }
        lienzoPG.image(this.imagenTrazo, 0, 0, this.ancho, this.alto);
        lienzoPG.pop();
    }
    
    estaEnPantalla() {
        if (this.direccion === 'vertical') {
            return this.posicionY <= height + this.alto / 2;
        } else if (this.direccion === 'horizontal') {
            return this.posicionX <= width + this.ancho / 2;
        } else if (this.direccion === 'diagonal') {
            return (this.posicionX >= -this.ancho && this.posicionX <= width + this.ancho &&
                    this.posicionY >= -this.alto && this.posicionY <= height + this.alto);
        }
        return true;
    }
}