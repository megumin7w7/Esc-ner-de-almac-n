// === MODELOS ===
let productos = JSON.parse(localStorage.getItem('productos')) || [];
let codigos   = JSON.parse(localStorage.getItem('codigos'))   || [];
let ajustes   = JSON.parse(localStorage.getItem('ajustes'))   || [];

const USUARIO_ACTUAL = "Admin";

function guardarEnStorage() {
  try {
    localStorage.setItem('productos', JSON.stringify(productos));
    localStorage.setItem('codigos',   JSON.stringify(codigos));
    localStorage.setItem('ajustes',   JSON.stringify(ajustes));
    return true;
  } catch (e) {
    console.error("Error guardando en localStorage:", e);
    alert("❌ No se pudo guardar.\nLa imagen es muy pesada.\nProbá con una foto más liviana.");
    return false;
  }
}


// ---------- 🔁 FLUJO COMPLETO DE INGRESO POR CÓDIGO ----------
function registrarCodigoBarras(codigoBarra) {
  codigoBarra = codigoBarra.trim();
  if (!codigoBarra) return;

  const existe = codigos.find(c => c.codigoBarra === codigoBarra);
  if (existe) {
    alert("📌 Código ya registrado. No se suma stock.");
    return;
  }

  const html = `
    <div class="card-dark" style="max-width:400px;margin:auto;">
      <p><strong>Código nuevo:</strong> ${codigoBarra}</p>
      <p>¿Querés asociar este código a un producto existente o crear uno nuevo?</p>
      <br>
      <button id="btn-asis-exist" class="btn" style="width:100%;margin-bottom:0.5rem;">🔗 Asociar a existente</button>
      <button id="btn-asis-new"  class="btn" style="width:100%;background:var(--success);">✨ Crear producto nuevo</button>
    </div>
  `;
  cambiarAVista(html, "📥 Asociar código");

  document.getElementById('btn-asis-exist').onclick = () => mostrarSelectorProducto(codigoBarra);
  document.getElementById('btn-asis-new').onclick  = () => mostrarFormularioCompleto(codigoBarra, true);
}

function mostrarSelectorProducto(codigoBarra) {
  if (productos.length === 0) {
    alert("No hay productos. Creá uno nuevo.");
    mostrarFormularioCompleto(codigoBarra, true);
    return;
  }

  const html = `
    <p>Seleccioná el producto al que querés asociar el código <strong>${codigoBarra}</strong>:</p>
    <input type="text" id="busca-prod" placeholder="Escribí nombre o categoría..." style="width:100%;padding:0.8rem;margin:1rem 0;">
    <div id="res-prod" style="max-height:250px;overflow-y:auto;"></div>
  `;
  cambiarAVista(html, "🔗 Asociar a producto");

  const input = document.getElementById('busca-prod');
  const res   = document.getElementById('res-prod');

  input.oninput = () => {
    const t = input.value.trim().toLowerCase();
    const filtrados = productos.filter(p =>
      p.nombre.toLowerCase().includes(t) || p.categoria.toLowerCase().includes(t)
    );
    res.innerHTML = filtrados.map(p => `
      <div class="item-dark">
        <strong>${p.nombre}</strong> (${p.categoria}) – Stock: ${p.stockActual}
      </div>
    `).join('');
    res.querySelectorAll('.producto-item').forEach((div, idx) => {
      div.onclick = () => asociarCodigoAProducto(codigoBarra, filtrados[idx].id);
    });
  };
  input.oninput();
}

function asociarCodigoAProducto(codigoBarra, productoId) {
  const prod = productos.find(p => p.id === productoId);
  if (!prod) return;

  codigos.push({ codigoBarra, productoId, fechaRegistro: new Date().toISOString() });
  prod.stockActual += 1;
  ajustes.unshift({
    id: Date.now(),
    productoId: prod.id,
    nombreProducto: prod.nombre,
    stockAnterior: prod.stockActual - 1,
    stockNuevo: prod.stockActual,
    diferencia: +1,
    fecha: new Date().toISOString(),
    usuario: USUARIO_ACTUAL,
    motivo: 'Ingreso por código de barras'
  });

  guardarEnStorage();
  alert(`✅ Código ${codigoBarra} asociado a "${prod.nombre}". Stock: ${prod.stockActual}`);
  mostrarListaProductos();

}

// ---------- VISTAS Y NAVEGACIÓN ----------
function cambiarAVista(htmlContent, titulo = "") {
  const contenedor = document.getElementById('contenedor-principal');
  contenedor.classList.add('animando');
  const nuevoContenido = document.createElement('div');
  nuevoContenido.className = 'vista-contenido card';
  nuevoContenido.innerHTML = `<h2>${titulo}</h2>` + htmlContent;
  contenedor.innerHTML = '';
  contenedor.appendChild(nuevoContenido);
  void nuevoContenido.offsetWidth;
  setTimeout(() => {
    nuevoContenido.classList.add('activa');
    contenedor.classList.remove('animando');
    playTransitionSound();
  }, 30);
}

function mostrarFormularioAlta() {
  const html = `
    <p>¿Cómo querés agregarlo?</p>
    <div class="opciones-alta" style="display:flex;gap:1rem;">
      <button id="btn-manual" class="btn">📝 Manual</button>
      <button id="btn-codigo" class="btn">🔖 Por código de barras</button>
    </div>
  `;
  cambiarAVista(html, "➕ Nuevo Producto");
  setTimeout(() => {
    document.getElementById('btn-manual').onclick = () => mostrarFormularioCompleto(null, false, true); // ✅ NUEVO: modo manual
    document.getElementById('btn-codigo').onclick  = () => mostrarFormularioPorCodigo();
  }, 200);
}


// ✅ OPTIMIZADO: Nuevo parámetro "esManual" para ocultar el código
function mostrarFormularioCompleto(codigoPredefinido = null, vieneDeEscaneo = false, esManual = false) {
  const html = `
    <form id="form-producto" class="card-form" style="max-width:600px;">
      ${!esManual ? `
        <label>Código de barras:
          <input type="text" id="codigo"
            value="${codigoPredefinido || ''}"
            ${codigoPredefinido ? 'readonly' : ''}
            style="width:100%;padding:0.5rem;margin:0.5rem 0;">
        </label><br>
      ` : ''}

      <label>Nombre:
        <input type="text" id="nombre" required
          style="width:100%;padding:0.5rem;margin:0.5rem 0;">
      </label><br>

      <label>Categoría:
        <input type="text" id="categoria"
          placeholder="Ej: Coloración, Corte, Higiene"
          style="width:100%;padding:0.5rem;margin:0.5rem 0;">
      </label><br>

      ${vieneDeEscaneo ? '' : `
        <label>Stock inicial:
          <input type="number" id="stock" value="0" min="0" required
            style="width:100%;padding:0.5rem;margin:0.5rem 0;">
        </label><br>
      `}

      <label>Punto de reposición:
        <input type="number" id="reposicion" value="5" min="0" required
          style="width:100%;padding:0.5rem;margin:0.5rem 0;">
      </label><br>

      <label>Foto del producto:
        <input type="file" id="foto" accept="image/*" capture="environment"
          style="width:100%;padding:0.3rem;margin:0.5rem 0;">
      </label><br><br>

      <button type="submit" id="btn-guardar-prod" class="btn"
        style="background:var(--primary);color:white;padding:0.8rem 2rem;border:none;border-radius:12px;">
        💾 Guardar Producto
      </button>
    </form>
  `;

  cambiarAVista(html, "➕ Nuevo Producto");

  setTimeout(() => {
    const form = document.getElementById('form-producto');
    const btn  = document.getElementById('btn-guardar-prod');

    form.onsubmit = async (e) => {
      e.preventDefault();

      btn.disabled = true;
      btn.textContent = '⏳ Guardando...';

      // ✅ Si es manual, genera código interno automático
      let codigo = esManual ? generarCodigoInterno() : (document.getElementById('codigo')?.value.trim() || generarCodigoInterno());

      if (productos.some(p => p.codigo === codigo)) {
        alert("Ya existe producto con ese código.");
        btn.disabled = false;
        btn.textContent = '💾 Guardar Producto';
        return;
      }

      const nuevo = {
        id: Date.now(),
        codigo,
        nombre: document.getElementById('nombre').value.trim(),
        categoria: document.getElementById('categoria').value.trim() || 'Sin categoría',
        stockActual: vieneDeEscaneo
          ? 0
          : parseInt(document.getElementById('stock')?.value || 0),
        puntoReposicion: parseInt(document.getElementById('reposicion').value),
        fechaAlta: new Date().toISOString(),
        foto: false,
        fotoBlob: null
      };

      const fotoInput = document.getElementById('foto');

      if (fotoInput?.files?.[0]) {
        nuevo.fotoBlob = fotoInput.files[0];
      }

      await crearProductoConFoto(nuevo);

      btn.disabled = false;
      btn.textContent = '💾 Guardar Producto';
    };
  }, 150);
}



// ---------- CREAR PRODUCTO Y GUARDAR ----------
async function crearProductoConFoto(prod) {
  if (!db) await abrirDB();

  productos.push({
    id: prod.id,
    codigo: prod.codigo,
    codigoVisual: prod.codigo?.startsWith('INT-') ? '' : prod.codigo,
    nombre: prod.nombre,
    categoria: prod.categoria,
    stockActual: prod.stockActual,
    puntoReposicion: prod.puntoReposicion,
    fechaAlta: prod.fechaAlta,
    foto: !!prod.fotoBlob
  });

  if (prod.fotoBlob) {
    await guardarFoto(prod.id, prod.fotoBlob);
  }

  if (prod.stockActual > 0) {
    ajustes.unshift({
      id: Date.now(),
      productoId: prod.id,
      nombreProducto: prod.nombre,
      stockAnterior: 0,
      stockNuevo: prod.stockActual,
      diferencia: prod.stockActual,
      fecha: new Date().toISOString(),
      usuario: USUARIO_ACTUAL,
      tipo: "ENTRADA",
      cantidad: prod.stockActual
    });
  }

  guardarEnStorage();
  toast("✅ Producto creado");
  mostrarListaProductos();
}

// ✅ OPTIMIZADO: Lazy loading de imágenes con Intersection Observer
function mostrarListaProductos() {
  const html = `
    <input type="text" id="buscar" class="input-dark" placeholder="🔍 Buscar producto..." style="margin-bottom:1rem;">
    <div id="grid-productos" class="grid-productos"></div>
  `;
  cambiarAVista(html, "📦 Productos");

  const buscar = document.getElementById('buscar');
  const grid = document.getElementById('grid-productos');

  function renderizar(lista) {
    // ✅ Usar DocumentFragment para mejor performance
    const fragment = document.createDocumentFragment();

    lista.forEach(p => {
      const tarjeta = document.createElement('div');
      tarjeta.className = 'tarjeta-producto';
      
      const stockClass = p.stockActual <= p.puntoReposicion 
        ? (p.stockActual === 0 ? 'stock-muy-bajo' : 'stock-bajo') 
        : '';

      tarjeta.innerHTML = `
        <img class="tarjeta-foto lazy-img" data-producto-id="${p.id}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='120'%3E%3Crect width='150' height='120' fill='%23333'/%3E%3C/svg%3E" alt="${p.nombre}">
        <div class="tarjeta-info">
          <div class="tarjeta-nombre">${p.nombre}</div>
          <div class="tarjeta-categoria">${p.categoria}</div>
          <div class="tarjeta-stock ${stockClass}">Stock: ${p.stockActual}</div>
        </div>
        <button class="tarjeta-menu" onclick="event.stopPropagation(); mostrarMenuProducto(${p.id})">⋮</button>
      `;

      tarjeta.onclick = (e) => {
        if (!e.target.classList.contains('tarjeta-menu')) {
          mostrarDetalleProducto(p.id);
        }
      };

      fragment.appendChild(tarjeta);
    });

    grid.innerHTML = '';
    grid.appendChild(fragment);

    // ✅ Lazy loading con Intersection Observer
    inicializarLazyLoading();
  }

  buscar.oninput = () => {
    const termino = buscar.value.toLowerCase();
    const filtrados = productos.filter(p => 
      p.nombre.toLowerCase().includes(termino) || 
      p.categoria.toLowerCase().includes(termino) ||
      (p.codigoVisual && p.codigoVisual.toLowerCase().includes(termino))
    );
    renderizar(filtrados);
  };

  renderizar(productos);
}

// ✅ NUEVO: Intersection Observer para cargar imágenes solo cuando son visibles
function inicializarLazyLoading() {
  const imagenes = document.querySelectorAll('.lazy-img');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const productoId = parseInt(img.dataset.productoId);
        
        // Cargar la imagen real
        cargarImagenProducto(img, productoId);
        
        // Dejar de observar esta imagen
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px' // Cargar un poco antes de que sea visible
  });

  imagenes.forEach(img => imageObserver.observe(img));
}

// ✅ OPTIMIZADO: Cargar imagen individual de forma asíncrona
async function cargarImagenProducto(imgElement, productoId) {
  try {
    const blob = await obtenerFoto(productoId);
    if (blob) {
      imgElement.src = URL.createObjectURL(blob);
    } else {
      // Imagen placeholder si no hay foto
      imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="120"%3E%3Crect width="150" height="120" fill="%23444"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="14"%3ESin foto%3C/text%3E%3C/svg%3E';
    }
  } catch (error) {
    console.error('Error cargando imagen:', error);
  }
}

function mostrarDetalleProducto(id) {
  const p = productos.find(prod => prod.id === id);
  if (!p) return;

  const movimientos = ajustes.filter(a => a.productoId === id).slice(0, 10);
  const historialHTML = movimientos.length > 0
    ? movimientos.map(a => {
        const fecha = new Date(a.fecha).toLocaleString();
        const diff = a.diferencia >= 0 ? `+${a.diferencia}` : a.diferencia;
        const color = a.diferencia < 0 ? 'color:#e63946;' : a.diferencia > 0 ? 'color:#2a9d8f;' : '';
        return `<div style="padding:0.5rem;border-bottom:1px solid rgba(255,255,255,0.1);"><small>${fecha}</small><br><strong style="${color}">${diff}</strong> unidades (${a.stockAnterior} → ${a.stockNuevo})</div>`;
      }).join('')
    : '<p style="opacity:0.6;">No hay movimientos registrados</p>';

  const stockClass = p.stockActual <= p.puntoReposicion ? (p.stockActual === 0 ? 'stock-muy-bajo' : 'stock-bajo') : '';

  const html = `
    <div class="card-dark" style="text-align:center;">
      <img id="detalle-foto" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23333'/%3E%3C/svg%3E" 
           style="width:100%;max-width:300px;height:auto;border-radius:12px;margin:1rem auto;object-fit:contain;background:rgba(255,255,255,0.05);">
      <h3>${p.nombre}</h3>
      <p><strong>Categoría:</strong> ${p.categoria}</p>
      ${p.codigoVisual ? `<p><strong>Código:</strong> ${p.codigoVisual}</p>` : ''}
      <p class="${stockClass}" style="font-size:1.3rem;"><strong>Stock actual: ${p.stockActual}</strong></p>
      <p>Punto de reposición: ${p.puntoReposicion}</p>
      <div style="display:flex;gap:0.5rem;justify-content:center;margin:1rem 0;">
        <button class="btn" onclick="mostrarFormularioAjuste(${id})" style="background:var(--primary);color:white;padding:0.6rem 1.2rem;border:none;border-radius:8px;">🔄 Ajustar Stock</button>
        <button class="btn" onclick="editarProducto(${id})" style="background:var(--warning);color:white;padding:0.6rem 1.2rem;border:none;border-radius:8px;">✏️ Editar</button>
        <button class="btn" onclick="eliminarProducto(${id})" style="background:var(--danger);color:white;padding:0.6rem 1.2rem;border:none;border-radius:8px;">🗑️ Eliminar</button>
      </div>
    </div>
    <div class="card-dark" style="margin-top:1rem;">
      <h3>📊 Últimos movimientos</h3>
      ${historialHTML}
    </div>
  `;

  cambiarAVista(html, "🔍 Detalle del Producto");

  // Cargar foto de detalle
  const imgDetalle = document.getElementById('detalle-foto');
  cargarImagenProducto(imgDetalle, id);
}

function mostrarMenuProducto(id) {
  const p = productos.find(prod => prod.id === id);
  if (!p) return;

  const opciones = [
    { texto: "🔍 Ver detalle", accion: () => mostrarDetalleProducto(id) },
    { texto: "🔄 Ajustar stock", accion: () => mostrarFormularioAjuste(id) },
    { texto: "✏️ Editar", accion: () => editarProducto(id) },
    { texto: "🗑️ Eliminar", accion: () => eliminarProducto(id) }
  ];

  const html = `
    <div class="card-dark" style="max-width:300px;margin:auto;">
      <h3>${p.nombre}</h3>
      <div style="display:flex;flex-direction:column;gap:0.5rem;margin-top:1rem;">
        ${opciones.map((o, i) => `<button id="opt-${i}" class="btn" style="width:100%;text-align:left;background:rgba(255,255,255,0.1);border:none;color:white;padding:0.8rem;border-radius:8px;">${o.texto}</button>`).join('')}
      </div>
    </div>
  `;

  cambiarAVista(html, "⚙️ Opciones");

  opciones.forEach((o, i) => {
    document.getElementById(`opt-${i}`).onclick = o.accion;
  });
}

function editarProducto(id) {
  const p = productos.find(prod => prod.id === id);
  if (!p) return;

  const html = `
    <form id="form-edit" class="card-form">
      <label>Nombre:
        <input type="text" id="edit-nombre" value="${p.nombre}" required style="width:100%;padding:0.6rem;margin:0.5rem 0;">
      </label><br>
      <label>Categoría:
        <input type="text" id="edit-categoria" value="${p.categoria}" style="width:100%;padding:0.6rem;margin:0.5rem 0;">
      </label><br>
      <label>Punto de reposición:
        <input type="number" id="edit-repo" value="${p.puntoReposicion}" min="0" style="width:100%;padding:0.6rem;margin:0.5rem 0;">
      </label><br>
      <label>Cambiar foto (opcional):
        <input type="file" id="edit-foto" accept="image/*" capture="environment" style="width:100%;padding:0.3rem;margin:0.5rem 0;">
      </label><br><br>
      <button type="submit" class="btn" style="background:var(--primary);color:white;padding:0.8rem 2rem;border:none;border-radius:12px;">💾 Guardar Cambios</button>
    </form>
  `;

  cambiarAVista(html, "✏️ Editar Producto");

  document.getElementById('form-edit').onsubmit = async (e) => {
    e.preventDefault();

    p.nombre = document.getElementById('edit-nombre').value.trim();
    p.categoria = document.getElementById('edit-categoria').value.trim() || 'Sin categoría';
    p.puntoReposicion = parseInt(document.getElementById('edit-repo').value);

    const fotoInput = document.getElementById('edit-foto');
    if (fotoInput.files[0]) {
      await guardarFoto(p.id, fotoInput.files[0]);
      p.foto = true;
    }

    guardarEnStorage();
    toast("✅ Producto actualizado");
    mostrarDetalleProducto(id);
  };
}

function eliminarProducto(id) {
  const p = productos.find(prod => prod.id === id);
  if (!p) return;

  if (!confirm(`¿Eliminar "${p.nombre}"?\nEsta acción no se puede deshacer.`)) return;

  productos = productos.filter(prod => prod.id !== id);
  ajustes = ajustes.filter(a => a.productoId !== id);
  codigos = codigos.filter(c => c.productoId !== id);

  guardarEnStorage();
  toast("🗑️ Producto eliminado");
  mostrarListaProductos();
}

function generarCodigoInterno() {
  return `INT-${Date.now()}`;
}

function toast(mensaje) {
  const div = document.createElement('div');
  div.textContent = mensaje;
  div.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.9);color:white;padding:1rem 2rem;border-radius:12px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2000);
}

function mostrarFormularioPorCodigo() {
  const html = `
    <div class="card-dark" style="text-align:center;max-width:400px;margin:auto;">
      <p>Escaneá o ingresá manualmente el código de barras del producto</p>
      <div style="margin:2rem 0;">
        <button id="btn-escanear" class="btn" style="width:100%;margin-bottom:1rem;background:var(--primary);color:white;padding:1rem;border:none;border-radius:12px;font-size:1.1rem;">📷 Escanear con cámara</button>
        <p style="opacity:0.6;">o</p>
        <input type="text" id="input-codigo-manual" placeholder="Ingresá código manualmente" style="width:100%;padding:0.8rem;margin:0.5rem 0;" autofocus>
        <button id="btn-codigo-manual" class="btn" style="width:100%;background:var(--success);color:white;padding:0.8rem;border:none;border-radius:12px;">✅ Confirmar código</button>
      </div>
    </div>
  `;
  cambiarAVista(html, "🔖 Ingreso por Código");

  document.getElementById('btn-escanear').onclick = iniciarEscaneo;
  document.getElementById('btn-codigo-manual').onclick = () => {
    const codigo = document.getElementById('input-codigo-manual').value.trim();
    if (codigo) registrarCodigoBarras(codigo);
  };
  document.getElementById('input-codigo-manual').onkeypress = (e) => {
    if (e.key === 'Enter') document.getElementById('btn-codigo-manual').click();
  };
}

function iniciarEscaneo() {
  const html = `
    <div style="text-align:center;">
      <div id="camera-container"></div>
      <p id="estado-escaner" style="margin:1rem 0;font-weight:600;">Iniciando cámara...</p>
      <button id="btn-stop-scan" class="btn-cancelar">❌ Cancelar</button>
    </div>
  `;
  cambiarAVista(html, "📷 Escaneando...");

  setTimeout(() => {
    document.getElementById('btn-stop-scan').onclick = () => {
      if (typeof Quagga !== 'undefined') Quagga.stop();
      mostrarFormularioPorCodigo();
    };

    if (typeof Quagga === 'undefined') {
      document.getElementById('estado-escaner').textContent = '❌ Escáner no disponible';
      return;
    }

    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: document.querySelector('#camera-container'),
        constraints: {
          facingMode: "environment"
        }
      },
      decoder: {
        readers: ["ean_reader", "code_128_reader", "upc_reader"]
      }
    }, (err) => {
      if (err) {
        document.getElementById('estado-escaner').textContent = '❌ Error al acceder a la cámara';
        return;
      }
      document.getElementById('estado-escaner').textContent = '✅ Buscando código...';
      Quagga.start();
    });

    Quagga.onDetected((result) => {
      const codigo = result.codeResult.code;
      Quagga.stop();
      registrarCodigoBarras(codigo);
    });
  }, 100);
}

function mostrarFormularioAjuste(id) {
  const p = productos.find(prod => prod.id === id);
  if (!p) return;

  const html = `
    <div class="card-form" style="max-width:400px;margin:auto;">
      <p><strong>Producto:</strong> ${p.nombre}</p>
      <p><strong>Stock actual:</strong> ${p.stockActual}</p>
      <br>
      <label>Tipo de movimiento:
        <select id="tipo-mov" class="select-dark" style="width:100%;padding:0.6rem;margin:0.5rem 0;">
          <option value="ENTRADA">📥 Entrada (aumenta stock)</option>
          <option value="SALIDA">📤 Salida (reduce stock)</option>
        </select>
      </label><br>
      <label>Cantidad:
        <input type="number" id="cantidad" min="1" value="1" required style="width:100%;padding:0.6rem;margin:0.5rem 0;">
      </label><br><br>
      <button id="btn-aplicar" class="btn" style="width:100%;background:var(--primary);color:white;padding:0.8rem;border:none;border-radius:12px;">✅ Aplicar Ajuste</button>
    </div>
  `;

  cambiarAVista(html, "🔄 Ajustar Stock");

  setTimeout(() => {
    document.getElementById('btn-aplicar').onclick = () => {
      const tipo = document.getElementById('tipo-mov').value;
      const cantidad = parseInt(document.getElementById('cantidad').value);

      if (cantidad <= 0) {
        alert("La cantidad debe ser mayor a 0");
        return;
      }

      const stockAnterior = p.stockActual;
      const diferencia = tipo === "ENTRADA" ? cantidad : -cantidad;
      p.stockActual += diferencia;

      if (p.stockActual < 0) {
        alert("No podés tener stock negativo");
        p.stockActual = stockAnterior;
        return;
      }

      ajustes.unshift({
        id: Date.now(),
        productoId: p.id,
        nombreProducto: p.nombre,
        stockAnterior,
        stockNuevo: p.stockActual,
        diferencia,
        cantidad,
        tipo,
        fecha: new Date().toISOString(),
        usuario: USUARIO_ACTUAL
      });

      guardarEnStorage();
      toast("Stock actualizado");
      mostrarListaProductos();
    };
  }, 100);
}



function resumenInventario() {
  const resumen = productos.map(p => {
    const movs = ajustes.filter(a => a.productoId === p.id);
    const salidas = movs.filter(a => a.tipo === "SALIDA").reduce((s,a) => s + a.cantidad, 0);
    const entradas = movs.filter(a => a.tipo === "ENTRADA").reduce((s,a) => s + a.cantidad, 0);

    return {
      producto: p.nombre,
      stockActual: p.stockActual,
      totalEntradas: entradas,
      totalSalidas: salidas
    };
  });

  console.table(resumen);
}

function mostrarAlertas() {
  const enAlerta = productos.filter(p => p.stockActual <= p.puntoReposicion);
  let html = '';
  if (enAlerta.length > 0) {
    html += `<h3>⚠️ Productos en alerta de reposición</h3><div class="lista-alertas">`;
    html += enAlerta.map(p => `
      <div class="alerta-item">
        <strong>${p.nombre}</strong> (Cód: ${p.codigo})<br>📦 Stock: ${p.stockActual} / 🔁 Reposición: ${p.puntoReposicion}
        <button class="btn" onclick="mostrarFormularioAjuste(${p.id})" style="margin-top:0.5rem;background:var(--primary);color:white;padding:0.4rem 1rem;border:none;border-radius:8px;">🔄 Ajustar</button>
      </div>
    `).join('');
    html += `</div>`;
  } else {
    html += `
  <div class="card-dark" style="text-align:center;">
    ✅ Todos los productos están por encima del punto de reposición.
  </div>
  `;

  }
  cambiarAVista(html, "⚠️ Alertas y Análisis");
}


function mostrarHistorial() {
  if (ajustes.length === 0) {
    const html = `<p>📦 No hay ajustes registrados aún.</p><button class="btn" onclick="mostrarListaProductos()"
" style="background:var(--primary);color:white;padding:0.8rem 2rem;border:none;border-radius:12px;margin-top:1rem;">🔄 Ir a Ajustes</button>`;
    cambiarAVista(html, "📂 Historial de Ajustes");
    return;
  }
  const filas = ajustes.map(a => {
    const fecha = new Date(a.fecha).toLocaleString();
    const diff = a.diferencia >= 0 ? `+${a.diferencia}` : a.diferencia;
    const color = a.diferencia < 0 ? 'color: #e63946;' : a.diferencia > 0 ? 'color: #2a9d8f;' : '';
    return `<tr><td>${fecha}</td><td>${a.nombreProducto}</td><td>${a.stockAnterior} → ${a.stockNuevo}</td><td style="${color}">${diff}</td><td></td></tr>`;
  }).join('');
  const html = `
    <div class="card-form" style="overflow-x:auto;">
      <table style="width:100%;min-width:600px;"><thead><tr><th>Fecha/Hora</th><th>Producto</th><th>Stock</th><th>Dif.</th><th></th></tr></thead><tbody>${filas}</tbody></table>
    </div><br>
    <button class="btn" onclick="descargarHistorial()" style="background:var(--success);color:white;padding:0.8rem 2rem;border:none;border-radius:12px;">📥 Descargar CSV</button>
  <button class="btn" onclick="limpiarHistorial()"
  style="background:var(--danger);color:white;padding:0.8rem 2rem;border:none;border-radius:12px;">
  🧹 Limpiar historial
</button>
`;
  cambiarAVista(html, "📂 Historial de Ajustes");
}

function descargarHistorial() {
  const cabeceras = ['Fecha','Producto','Stock Anterior','Stock Nuevo','Diferencia','Usuario'];
  const filas = ajustes.map(a => [new Date(a.fecha).toLocaleString(), a.nombreProducto, a.stockAnterior, a.stockNuevo, a.diferencia, a.usuario]);
  let csv = cabeceras.join(',') + '\n' + filas.map(f => f.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `historial_stock_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

function playTransitionSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 320;
    gain.gain.value = 0.03;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

const DB_NAME = "inventario_db";
const DB_VERSION = 1;
let db = null;

function abrirDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = e => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains("fotos")) {
        db.createObjectStore("fotos");
      }

      if (!db.objectStoreNames.contains("datos")) {
        db.createObjectStore("datos");
      }
    };

    request.onsuccess = e => {
      db = e.target.result;
      resolve(db);
    };

    request.onerror = () => reject("Error abriendo IndexedDB");
  });
}

function guardarFoto(productoId, blob) {
  return new Promise(resolve => {
    const tx = db.transaction("fotos", "readwrite");
    const store = tx.objectStore("fotos");
    store.put(blob, `foto_${productoId}`);
    tx.oncomplete = resolve;
  });
}

function obtenerFoto(productoId) {
  return new Promise(resolve => {
    const tx = db.transaction("fotos", "readonly");
    const store = tx.objectStore("fotos");
    const req = store.get(`foto_${productoId}`);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

async function renderProductoFoto(imgEl, productoId) {
  const blob = await obtenerFoto(productoId);
  if (!blob || !imgEl) return;
  imgEl.src = URL.createObjectURL(blob);
}


function crearBackup() {
  const backup = {
    fecha: new Date().toISOString(),
    productos: productos.map(p => ({ ...p, foto: false })),
    ajustes,
    codigos
  };
  localStorage.setItem("backup_inventario", JSON.stringify(backup));
}

function restaurarDesdeBackup() {
  const raw = localStorage.getItem("backup_inventario");
  if (!raw) return false;

  try {
    const data = JSON.parse(raw);
    productos = data.productos || [];
    ajustes   = data.ajustes   || [];
    codigos   = data.codigos   || [];
    guardarEnStorage();
    return true;
  } catch {
    return false;
  }
}
function normalizarCodigosVisuales() {
  productos.forEach(p => {
    if (!p.codigoVisual) {
      p.codigoVisual = p.codigo?.startsWith('INT-') ? '' : p.codigo;
    }
  });
  guardarEnStorage();
}


// ---------- INICIALIZACIÓN ----------
window.addEventListener("DOMContentLoaded", async () => {
  await abrirDB();

  normalizarCodigosVisuales();

  if (productos.length === 0) {
    restaurarDesdeBackup();
  }

  mostrarListaProductos();
});



// ---------- BURBUJA FLOTANTE ----------
const fabToggle = document.getElementById('fab-toggle');
const fabOptions = document.getElementById('fab-options');
fabToggle?.addEventListener('click', () => fabOptions.classList.toggle('show'));
document.addEventListener('click', (e) => {
  if (!e.target.closest('#fab-menu')) fabOptions.classList.remove('show');
});

function limpiarHistorial() {
  if (!confirm("⚠️ Esto eliminará TODO el historial de movimientos.\nLos productos y el stock NO se verán afectados.\n\n¿Continuar?")) {
    return;
  }

  ajustes = [];
  guardarEnStorage();
  alert("🧹 Historial limpiado correctamente.");
  mostrarListaProductos();
}