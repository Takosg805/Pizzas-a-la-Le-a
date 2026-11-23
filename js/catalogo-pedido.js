(function () {
    "use strict";

    const claveCatalogo = "catalogoAllende";
    const clavePedido = "pedidoAllende";
    const claveConfiguracion = "configuracionAllende";

    const catalogoInicial = [
        {
            id: "peperoni",
            nombre: "Peperoni",
            categoria: "Pizzas",
            ingredientes: "Salsa de tomate, queso mozzarella, peperoni y un toque de especias.",
            extras: "Queso extra:20\nPeperoni extra:25",
            precio: 250,
            activo: "Disponible",
            imagen: "images/pizza_peperoni.png"
        },
        {
            id: "hawaiana",
            nombre: "Hawaiana",
            categoria: "Pizzas",
            ingredientes: "Salsa de tomate, queso mozzarella, jamón y piña.",
            extras: "Queso extra:20\nPiña extra:15",
            precio: 250,
            activo: "Disponible",
            imagen: "images/pizza_hawaiana.png"
        },
        {
            id: "especial-allende",
            nombre: "Especial Allende",
            categoria: "Pizzas",
            ingredientes: "Salsa de tomate, queso mozzarella, jamón, peperoni, champiñones, pimiento morrón, cebolla y aceitunas.",
            extras: "Queso extra:20\nChampiñones extra:20",
            precio: 250,
            activo: "Disponible",
            imagen: "images/pizza_mexicana.png"
        }
    ];

    function obtenerCatalogo() {
        try {
            const guardado = JSON.parse(localStorage.getItem(claveCatalogo));
            return Array.isArray(guardado) ? guardado : catalogoInicial;
        } catch (error) {
            return catalogoInicial;
        }
    }

    function guardarCatalogo(productos) {
        localStorage.setItem(claveCatalogo, JSON.stringify(productos));
    }

    function obtenerPedido() {
        try {
            const guardado = JSON.parse(localStorage.getItem(clavePedido));
            return Array.isArray(guardado) ? guardado : [];
        } catch (error) {
            return [];
        }
    }

    function guardarPedido(pedido) {
        localStorage.setItem(clavePedido, JSON.stringify(pedido));
    }

    function obtenerConfiguracion() {
        try {
            const configuracionGuardada = JSON.parse(localStorage.getItem(claveConfiguracion));
            if (configuracionGuardada) return configuracionGuardada;
        } catch (error) {
            // Se conservarán los valores públicos por defecto si el almacenamiento no es válido.
        }
        return {
            whatsappVendedor: "7861249043",
            bancoTransferencia: "Por configurar",
            clabeTransferencia: ""
        };
    }

    function guardarConfiguracion(configuracion) {
        localStorage.setItem(claveConfiguracion, JSON.stringify(configuracion));
    }

    function convertirDineroImporte(valor) {
        return Number(valor).toLocaleString("es-MX", {
            style: "currency",
            currency: "MXN"
        });
    }

    function rutaImagen(producto) {
        if (producto.imagen) {
            if (producto.imagen.startsWith("data:")) return producto.imagen;
            if (window.location.pathname.includes("/admin/")) return "../../" + producto.imagen;
        }
        return "images/pizza_peperoni.png";
    }

    function escaparPdf(texto) {
        return String(texto).replace(/[^\x20-\x7EáéíóúÁÉÍÓÚñÑ]/g, "").replace(/([\\()])/g, "\\$1");
    }

    function dividirTexto(texto, longitud) {
        const palabras = String(texto).split(/\s+/);
        const lineas = [];
        let lineaActual = "";

        palabras.forEach(function (palabra) {
            if ((lineaActual + " " + palabra).trim().length <= longitud) {
                lineaActual = (lineaActual + " " + palabra).trim();
            } else {
                if (lineaActual) lineas.push(lineaActual);
                lineaActual = palabra;
            }
        });
        if (lineaActual) lineas.push(lineaActual);
        return lineas;
    }

    function descargarPdfPizzas() {
        const pizzas = obtenerCatalogo().filter(function (producto) {
            return producto.categoria === "Pizzas" && producto.activo !== "Retirado";
        });

        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert("No fue posible cargar el generador de PDF.");
            return;
        }

        const documento = new window.jspdf.jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
        documento.setProperties({
            title: "Menú de pizzas - Pizzas a la leña Allende",
            subject: "Catálogo de pizzas disponibles",
            author: "Pizzas a la leña Allende"
        });

        function dibujarEncabezado(numeroPagina) {
            documento.setFillColor(23, 23, 21);
            documento.rect(0, 0, 612, 92, "F");
            documento.setFillColor(184, 59, 43);
            documento.rect(40, 110, 532, 3, "F");
            documento.setTextColor(255, 255, 255);
            documento.setFont("helvetica", "bold");
            documento.setFontSize(22);
            documento.text("PIZZAS A LA LEÑA ALLENDE", 40, 48);
            documento.setFont("helvetica", "normal");
            documento.setFontSize(11);
            documento.text("MENÚ DE PIZZAS", 40, 72);
            documento.setTextColor(98, 90, 82);
            documento.setFontSize(9);
            documento.text("Página " + numeroPagina, 532, 742);
        }

        function cargarImagen(url) {
            return fetch(url).then(function (respuesta) {
                if (!respuesta.ok) throw new Error("Imagen no disponible");
                return respuesta.blob();
            }).then(function (blob) {
                return new Promise(function (resolver, rechazar) {
                    const lector = new FileReader();
                    lector.onload = function () { resolver(lector.result); };
                    lector.onerror = rechazar;
                    lector.readAsDataURL(blob);
                });
            }).catch(function () { return null; });
        }

        async function generarPdf() {
            if (pizzas.length === 0) {
                dibujarEncabezado(1);
                documento.setTextColor(184, 59, 43);
                documento.setFont("helvetica", "bold");
                documento.setFontSize(16);
                documento.text("No hay pizzas disponibles", 40, 160);
            } else {
                let numeroPagina = 1;
                for (let indice = 0; indice < pizzas.length; indice++) {
                    if (indice === 0) {
                        dibujarEncabezado(numeroPagina);
                    } else if (indice % 3 === 0) {
                        documento.addPage();
                        numeroPagina++;
                        dibujarEncabezado(numeroPagina);
                    }

                    const posicionTarjeta = indice % 3;
                    const yTarjeta = 132 + posicionTarjeta * 190;
                    const pizza = pizzas[indice];

                    documento.setDrawColor(216, 200, 184);
                    documento.setFillColor(255, 255, 255);
                    documento.roundedRect(40, yTarjeta, 532, 172, 8, 8, "FD");
                    documento.setFillColor(184, 59, 43);
                    documento.rect(40, yTarjeta, 8, 172, "F");

                    const imagen = await cargarImagen(pizza.imagen && pizza.imagen.startsWith("data:")
                        ? pizza.imagen
                        : (pizza.imagen ? new URL(pizza.imagen, window.location.href).href : new URL("images/pizza_peperoni.png", window.location.href).href));
                    if (imagen) {
                        try {
                            documento.addImage(imagen, "PNG", 58, yTarjeta + 16, 140, 140, undefined, "FAST");
                        } catch (error) {
                            documento.setFillColor(234, 227, 216);
                            documento.rect(58, yTarjeta + 16, 140, 140, "F");
                        }
                    }

                    documento.setTextColor(38, 35, 31);
                    documento.setFont("helvetica", "bold");
                    documento.setFontSize(17);
                    documento.text(pizza.nombre, 218, yTarjeta + 34);
                    documento.setTextColor(184, 59, 43);
                    documento.setFontSize(15);
                    documento.text(convertirDineroImporte(pizza.precio), 550, yTarjeta + 34, { align: "right" });

                    documento.setTextColor(98, 90, 82);
                    documento.setFont("helvetica", "normal");
                    documento.setFontSize(10);
                    const lineasIngredientes = documento.splitTextToSize(pizza.ingredientes, 336);
                    documento.text(lineasIngredientes.slice(0, 5), 218, yTarjeta + 58);

                    documento.setTextColor(184, 59, 43);
                    documento.setFont("helvetica", "bold");
                    documento.setFontSize(9);
                    documento.text("PIZZAS A LA LEÑA ALLENDE", 218, yTarjeta + 142);
                }
            }
            documento.save("menu-pizzas-allende.pdf");
        }

        generarPdf();
    }

    function mostrarCatalogoPublico() {
        const contenedor = document.getElementById("product-grid");
        if (!contenedor) return;

        let categoriaActiva = "Pizzas";
        const botones = document.querySelectorAll(".seleccion");

        function renderizarCategoria(categoria) {
            const productos = obtenerCatalogo().filter(function (producto) {
                return producto.categoria === categoria && producto.activo !== "Retirado";
            });

            if (productos.length === 0) {
                contenedor.innerHTML = '<p class="empty">No hay productos disponibles en esta categoría.</p>';
                return;
            }

            contenedor.innerHTML = productos.map(function (producto) {
                return '<article class="contenedor-producto">' +
                    '<div class="imagenes"><img src="' + rutaImagen(producto).replace(/"/g, "&quot;") + '" alt="' + producto.nombre.replace(/"/g, "&quot;") + '"></div>' +
                    '<div class="info"><h3>' + producto.nombre + '</h3><p>' + producto.ingredientes + '</p></div>' +
                    '<div class="product-footer"><span class="price">' + convertirDineroImporte(producto.precio) + '</span>' +
                    '<button class="text-button" type="button" disabled>Ver extras</button>' +
                    '<button class="button small boton-agregar" type="button" data-id="' + producto.id + '">Agregar</button></div>' +
                    '</article>';
            }).join("");
        }

        botones.forEach(function (boton) {
            boton.addEventListener("click", function () {
                botones.forEach(function (otroBoton) {
                    otroBoton.classList.remove("active");
                    otroBoton.setAttribute("aria-pressed", "false");
                });
                boton.classList.add("active");
                boton.setAttribute("aria-pressed", "true");
                categoriaActiva = boton.textContent.trim();
                renderizarCategoria(categoriaActiva);
            });
        });

        contenedor.addEventListener("click", function (evento) {
            const boton = evento.target.closest(".boton-agregar");
            if (!boton) return;
            const producto = obtenerCatalogo().find(function (item) { return item.id === boton.dataset.id; });
            if (!producto) return;

            const pedido = obtenerPedido();
            const existente = pedido.find(function (item) { return item.id === producto.id; });
            if (existente) {
                existente.cantidad += 1;
            } else {
                pedido.push({
                    id: producto.id,
                    nombre: producto.nombre,
                    precio: producto.precio,
                    imagen: producto.imagen,
                    cantidad: 1
                });
            }
            guardarPedido(pedido);
            boton.textContent = "Agregado";
            setTimeout(function () { boton.textContent = "Agregar"; }, 700);
        });

        renderizarCategoria(categoriaActiva);
        const botonPdf = document.getElementById("download-menu");
        if (botonPdf) botonPdf.addEventListener("click", descargarPdfPizzas);
    }

    function mostrarPedido() {
        const contenedor = document.getElementById("cart-list");
        if (!contenedor) return;

        function renderizarPedido() {
            const pedido = obtenerPedido();
            if (pedido.length === 0) {
                contenedor.innerHTML = '<div class="empty"><h3>Tu pedido está vacío</h3><p>Agrega una pizza desde el menú.</p><a class="button" href="index.html#menu">Ver menú</a></div>';
                document.getElementById("checkout-layout").classList.add("pedido-vacio");
                const resumen = document.getElementById("cart-summary");
                if (resumen) resumen.querySelector(".total span:last-child").textContent = convertirDineroImporte(0);
                return;
            }

            contenedor.innerHTML = pedido.map(function (producto) {
                return '<article class="cart-row" data-id="' + producto.id + '">' +
                    '<img src="' + rutaImagen(producto).replace(/"/g, "&quot;") + '" alt="' + producto.nombre + '">' +
                    '<div><h3>' + producto.nombre + '</h3><p class="small">Sin extras</p>' +
                    '<div class="summary-line"><strong>' + convertirDineroImporte(producto.precio * producto.cantidad) + '</strong>' +
                    '<span class="small">' + convertirDineroImporte(producto.precio) + ' c/u</span></div>' +
                    '<div class="actions"><div class="quantity">' +
                    '<button type="button" data-operacion="restar" aria-label="Restar una unidad de ' + producto.nombre + '">−</button>' +
                    '<span>' + producto.cantidad + '</span>' +
                    '<button type="button" data-operacion="sumar" aria-label="Agregar una unidad de ' + producto.nombre + '">+</button>' +
                    '</div><button class="text-button boton-quitar" type="button">Quitar</button></div></div></article>';
            }).join("");

            const cantidad = pedido.reduce(function (total, producto) { return total + producto.cantidad; }, 0);
            const total = pedido.reduce(function (sumatoria, producto) { return sumatoria + producto.precio * producto.cantidad; }, 0);
            const resumen = document.getElementById("cart-summary");
            if (resumen) {
                resumen.querySelector(".summary-line:first-child span:last-child").textContent = cantidad;
                resumen.querySelector(".total span:last-child").textContent = convertirDineroImporte(total);
            }
        }

        contenedor.addEventListener("click", function (evento) {
            const fila = evento.target.closest(".cart-row");
            if (!fila) return;
            let pedido = obtenerPedido();
            const producto = pedido.find(function (item) { return item.id === fila.dataset.id; });
            if (!producto) return;

            if (evento.target.dataset.operacion === "sumar") producto.cantidad += 1;
            if (evento.target.dataset.operacion === "restar") producto.cantidad -= 1;
            if (evento.target.classList.contains("boton-quitar") || producto.cantidad <= 0) {
                pedido = pedido.filter(function (item) { return item.id !== producto.id; });
            }
            guardarPedido(pedido);
            renderizarPedido();
        });

        const formulario = document.getElementById("checkout-form");
        if (formulario) {
            const camposEntrega = document.getElementById("delivery-fields");
            const radiosEntrega = formulario.querySelectorAll('input[name="entrega"]');
            const datosTransferencia = document.getElementById("datos-transferencia");
            const radiosPago = formulario.querySelectorAll('input[name="pago"]');

            function actualizarDatosPago() {
                const seleccion = formulario.querySelector('input[name="pago"]:checked');
                if (!datosTransferencia || !seleccion) return;
                datosTransferencia.hidden = seleccion.value !== "Transferencia";
                if (seleccion.value === "Transferencia") {
                    const configuracion = obtenerConfiguracion();
                    document.getElementById("banco-transferencia").textContent =
                        configuracion.bancoTransferencia || "Por configurar";
                    document.getElementById("clabe-transferencia").textContent =
                        configuracion.clabeTransferencia || "Por configurar";
                }
            }

            radiosPago.forEach(function (radioPago) {
                radioPago.addEventListener("change", actualizarDatosPago);
            });
            actualizarDatosPago();

            function actualizarCamposEntrega() {
                const seleccion = formulario.querySelector('input[name="entrega"]:checked');
                if (!camposEntrega || !seleccion) return;
                const esDomicilio = seleccion.value === "A domicilio";
                camposEntrega.hidden = !esDomicilio;
                const campoDireccion = document.getElementById("direccion");
                if (campoDireccion) campoDireccion.required = esDomicilio;
            }

            radiosEntrega.forEach(function (radioEntrega) {
                radioEntrega.addEventListener("change", actualizarCamposEntrega);
            });
            actualizarCamposEntrega();

            formulario.addEventListener("submit", function (evento) {
                evento.preventDefault();
                const pedido = obtenerPedido();
                if (pedido.length === 0) {
                    document.getElementById("checkout-error").textContent = "Agrega al menos un producto antes de confirmar.";
                    return;
                }

                const nombre = document.getElementById("nombre").value.trim();
                const telefono = document.getElementById("telefono").value.trim();
                const direccion = document.getElementById("direccion").value.trim();
                const referencias = document.getElementById("referencias").value.trim();
                const entrega = formulario.querySelector('input[name="entrega"]:checked').value;
                const pago = formulario.querySelector('input[name="pago"]:checked').value;
                const configuracion = obtenerConfiguracion();
                const total = pedido.reduce(function (sumatoria, producto) {
                    return sumatoria + producto.precio * producto.cantidad;
                }, 0);

                let mensaje = "*NUEVO PEDIDO - PIZZAS A LA LEÑA ALLENDE*\n\n";
                mensaje += "*Datos del cliente*\n";
                mensaje += "Nombre: " + nombre + "\n";
                mensaje += "Teléfono: " + telefono + "\n";
                mensaje += "Entrega: " + entrega + "\n";
                if (entrega === "A domicilio") {
                    mensaje += "Dirección: " + direccion + "\n";
                    if (referencias) mensaje += "Referencias: " + referencias + "\n";
                }
                mensaje += "Pago: " + pago + "\n";
                if (pago === "Transferencia") {
                    mensaje += "Banco: " + (configuracion.bancoTransferencia || "Por configurar") + "\n";
                    mensaje += "CLABE: " + (configuracion.clabeTransferencia || "Por configurar") + "\n";
                }
                mensaje += "\n*Pedido*\n";
                pedido.forEach(function (producto) {
                    mensaje += producto.cantidad + " x " + producto.nombre + " - " +
                        convertirDineroImporte(producto.precio * producto.cantidad) + "\n";
                });
                mensaje += "\n*Total: " + convertirDineroImporte(total) + "*";

                const numeroVendedor = String(configuracion.whatsappVendedor || "7861249043").replace(/\D/g, "");
                const numeroWhatsApp = numeroVendedor.length === 10 ? "52" + numeroVendedor : numeroVendedor;
                const enlaceWhatsApp = "https://wa.me/" + numeroWhatsApp + "?text=" + encodeURIComponent(mensaje);

                const modalConfirmacion = document.getElementById("modal-confirmacion");
                if (modalConfirmacion) {
                    modalConfirmacion.classList.add("abierta");
                    modalConfirmacion.setAttribute("aria-hidden", "false");
                }
                window.open(enlaceWhatsApp, "_blank", "noopener,noreferrer");
            });
        }

        const botonCerrarModal = document.getElementById("cerrar-modal-confirmacion");
        if (botonCerrarModal) {
            botonCerrarModal.addEventListener("click", function () {
                const modalConfirmacion = document.getElementById("modal-confirmacion");
                modalConfirmacion.classList.remove("abierta");
                modalConfirmacion.setAttribute("aria-hidden", "true");
            });
        }
        const modalConfirmacion = document.getElementById("modal-confirmacion");
        if (modalConfirmacion) {
            modalConfirmacion.addEventListener("click", function (evento) {
                if (evento.target !== modalConfirmacion) return;
                modalConfirmacion.classList.remove("abierta");
                modalConfirmacion.setAttribute("aria-hidden", "true");
            });
        }

        renderizarPedido();
    }

    function administrarConfiguracion() {
        const formularioConfiguracion = document.getElementById("content-form");
        if (!formularioConfiguracion) return;

        const campoWhatsapp = document.getElementById("whatsapp-vendedor");
        if (!campoWhatsapp) return;
        const configuracion = obtenerConfiguracion();
        campoWhatsapp.value = configuracion.whatsappVendedor || "7861249043";
        const campoBanco = document.getElementById("banco-transferencia");
        const campoClabe = document.getElementById("clabe-transferencia");
        if (campoBanco) campoBanco.value = configuracion.bancoTransferencia || "Por configurar";
        if (campoClabe) campoClabe.value = configuracion.clabeTransferencia || "";

        formularioConfiguracion.addEventListener("submit", function (evento) {
            evento.preventDefault();
            const numeroWhatsapp = campoWhatsapp.value.trim();
            if (!numeroWhatsapp) {
                const mensajeError = document.getElementById("content-error");
                if (mensajeError) mensajeError.textContent = "Ingresa el WhatsApp del vendedor.";
                return;
            }
            guardarConfiguracion({
                whatsappVendedor: numeroWhatsapp.replace(/\D/g, ""),
                bancoTransferencia: campoBanco ? campoBanco.value.trim() : "Por configurar",
                clabeTransferencia: campoClabe ? campoClabe.value.trim().replace(/\D/g, "") : ""
            });
            const mensajeError = document.getElementById("content-error");
            if (mensajeError) mensajeError.textContent = "Configuración guardada correctamente.";
        });
    }

    function administrarCatalogo() {
        const formulario = document.getElementById("product-form");
        if (formulario) {
            const parametros = new URLSearchParams(window.location.search);
            const idEditar = parametros.get("id");
            let productos = obtenerCatalogo();
            const productoEditar = productos.find(function (producto) { return producto.id === idEditar; });

            if (productoEditar) {
                document.querySelector("h1").textContent = "Editar producto";
                document.getElementById("nombre").value = productoEditar.nombre;
                document.getElementById("categoria").value = productoEditar.categoria;
                document.getElementById("ingredientes").value = productoEditar.ingredientes;
                document.getElementById("extras").value = productoEditar.extras || "";
                document.getElementById("precio").value = productoEditar.precio;
                document.getElementById("activo").value = productoEditar.activo;
                if (productoEditar.imagen) document.getElementById("product-preview").src = productoEditar.imagen;
            }

            document.getElementById("imagen").addEventListener("change", function (evento) {
                const archivo = evento.target.files[0];
                if (!archivo) return;
                const lector = new FileReader();
                lector.onload = function () { document.getElementById("product-preview").src = lector.result; };
                lector.readAsDataURL(archivo);
            });

            formulario.addEventListener("submit", function (evento) {
                evento.preventDefault();
                const nombre = document.getElementById("nombre").value.trim();
                const categoria = document.getElementById("categoria").value;
                const ingredientes = document.getElementById("ingredientes").value.trim();
                const extras = document.getElementById("extras").value.trim();
                const precio = Number(document.getElementById("precio").value);
                const activo = document.getElementById("activo").value;
                const imagenActual = document.getElementById("product-preview").src;
                const imagen = imagenActual.startsWith("data:")
                    ? imagenActual
                    : (productoEditar ? productoEditar.imagen : "images/pizza_peperoni.png");

                if (!nombre || !ingredientes || precio <= 0) {
                    document.getElementById("product-form-error").textContent = "Completa los datos obligatorios.";
                    return;
                }

                if (productoEditar) {
                    Object.assign(productoEditar, { nombre: nombre, categoria: categoria, ingredientes: ingredientes, extras: extras, precio: precio, activo: activo, imagen: imagen });
                } else {
                    productos.push({
                        id: nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now(),
                        nombre: nombre,
                        categoria: categoria,
                        ingredientes: ingredientes,
                        extras: extras,
                        precio: precio,
                        activo: activo,
                        imagen: imagen
                    });
                }
                guardarCatalogo(productos);
                window.location.href = "productos.html";
            });
        }

        const tabla = document.getElementById("tabla-productos");
        if (tabla) {
            const productos = obtenerCatalogo();
            tabla.innerHTML = productos.map(function (producto) {
                return '<tr><td><img class="table-thumb" src="' + rutaImagen(producto).replace(/"/g, "&quot;") + '" alt="' + producto.nombre + '"></td>' +
                    '<td><strong>' + producto.nombre + '</strong><br><small>' + producto.categoria + '</small></td>' +
                    '<td>' + producto.ingredientes + '</td><td>' + convertirDineroImporte(producto.precio) + '</td>' +
                    '<td><span class="status">' + producto.activo + '</span></td>' +
                    '<td><div class="actions"><a class="button outline small" href="producto-formulario.html?id=' + encodeURIComponent(producto.id) + '">Editar</a>' +
                    '<button class="button ghost small boton-retirar" type="button" data-id="' + producto.id + '">' + (producto.activo === "Retirado" ? "Activar" : "Retirar") + '</button></div></td></tr>';
            }).join("");

            tabla.addEventListener("click", function (evento) {
                const boton = evento.target.closest(".boton-retirar");
                if (!boton) return;
                const productosActualizados = obtenerCatalogo();
                const producto = productosActualizados.find(function (item) { return item.id === boton.dataset.id; });
                if (!producto) return;
                producto.activo = producto.activo === "Retirado" ? "Disponible" : "Retirado";
                guardarCatalogo(productosActualizados);
                window.location.reload();
            });
        }
    }

    mostrarCatalogoPublico();
    mostrarPedido();
    administrarConfiguracion();
    administrarCatalogo();
})();
