function crearFooter() {
    const contenedorFooter = document.querySelector("#footer");

    if (!contenedorFooter) {
        return;
    }

    contenedorFooter.innerHTML = `
        <footer class="footer-tres-katanas">
            <div class="container footer-contenido">
                <div>
                    <h2>Tres Katanas</h2>
                    <p>Productos importados: perfumes arabes, electronica y vapers.</p>
                </div>

                <div class="footer-links">
                    <a class="footer-instagram" href="https://www.instagram.com/treskatanas.imp/" target="_blank" rel="noopener noreferrer">
                        Instagram
                    </a>
                    <a class="footer-whatsapp" href="https://wa.me/5493764587016" target="_blank" rel="noopener noreferrer">
                        WhatsApp
                    </a>
                </div>
            </div>
        </footer>
    `;
}

crearFooter();
