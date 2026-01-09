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
    document.getElementById('btn-manual').onclick = () => mostrarFormularioCompleto();
    document.getElementById('btn-codigo').onclick  = () => mostrarFormularioPorCodigo();
  }, 200);
}


function mostrarFormularioCompleto(codigoPredefinido = null, vieneDeEscaneo = false) {
  const html = `
    <form id="form-producto" class="card-form" style="max-width:600px;">
      <label>Código de barras:
        <input type="text" id="codigo"
          value="${codigoPredefinido || ''}"
          ${codigoPredefinido ? 'readonly' : ''}
          style="width:100%;padding:0.5rem;margin:0.5rem 0;">
      </label><br>

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

      let codigo = document.getElementById('codigo').value.trim();
      if (!codigo) codigo = generarCodigoInterno();

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
        foto: false,        // solo indicador
        fotoBlob: null      // 👈 aquí va el Blob real
      };

      const fotoInput = document.getElementById('foto');

      if (fotoInput?.files?.[0]) {
        nuevo.fotoBlob = fotoInput.files[0]; // ✅ Blob directo
      }

      await crearProductoConFoto(nuevo);

      btn.disabled = false;
      btn.textContent = '💾 Guardar Producto';
    };
  }, 150);
}



// ---------- CREAR PRODUCTO Y GUARDAR ----------
async function crearProductoConFoto(nuevoProducto) {

  // 1️⃣ Guardar producto SIN imagen
  productos.push({
    ...nuevoProducto,
    foto: !!nuevoProducto.fotoBlob
  });

  // 2️⃣ Registrar código de barras (igual que antes)
  if (
    nuevoProducto.codigo &&
    !nuevoProducto.codigo.startsWith('INT-') &&
    !codigos.some(c => c.codigoBarra === nuevoProducto.codigo)
  ) {
    codigos.push({
      codigoBarra: nuevoProducto.codigo,
      productoId: nuevoProducto.id,
      fechaRegistro: new Date().toISOString()
    });
  }

  // 3️⃣ Ajuste inicial
  ajustes.unshift({
    id: Date.now(),
    productoId: nuevoProducto.id,
    nombreProducto: nuevoProducto.nombre,
    stockAnterior: 0,
    stockNuevo: nuevoProducto.stockActual,
    diferencia: nuevoProducto.stockActual,
    fecha: new Date().toISOString(),
    usuario: USUARIO_ACTUAL,
    motivo: 'Alta de producto'
  });

  // 4️⃣ Guardar datos livianos
  const ok = guardarEnStorage();
  if (!ok) {
    productos.pop();
    ajustes.shift();
    codigos = codigos.filter(c => c.productoId !== nuevoProducto.id);
    return;
  }

  // 5️⃣ Guardar imagen REAL en IndexedDB
  if (nuevoProducto.fotoBlob) {
    await guardarFoto(nuevoProducto.id, nuevoProducto.fotoBlob);
  }

  // 6️⃣ Backup automático
  crearBackup();

  alert(`✅ Producto "${nuevoProducto.nombre}" creado correctamente`);
  mostrarListaProductos();
}




function generarCodigoInterno() {
  const numero = productos.length + 1;
  return `INT-${String(numero).padStart(4, '0')}`;
}


// ---------- LECTOR NATIVO DEL CELULAR ----------
function mostrarFormularioPorCodigo() {
  const input = document.getElementById('camaraNativa');
  if (!input) {
    alert("Input nativo no encontrado – usá modo tradicional");
    mostrarFormularioPorCodigoTradicional();
    return;
  }

  input.value = '';
  input.focus();                          // abre scanner del sistema

  input.oninput = () => {
    const codigo = input.value.trim();
    if (codigo) {
      input.oninput = null;               // evito dobles
      registrarCodigoBarras(codigo);      // tu lógica
    }
  };

  // Si no leyó en 4 s → caigo al tradicional
  setTimeout(() => {
    if (!input.value) {
      input.oninput = null;
      mostrarFormularioPorCodigoTradicional();
    }
  }, 4000);
}

// ---------- MODO TRADICIONAL MEJORADO ----------
function mostrarFormularioPorCodigoTradicional() {
  const html = `
    <p>Acercá el código – el cuadrado verde lo rodeará cuando lo detecte</p>
    <div id="camera-container" style="position:relative;width:100%;max-width:500px;height:300px;border:3px solid var(--border);border-radius:12px;overflow:hidden;margin:1rem auto;background:#000;">
      <div id="interactive" style="width:100%;height:100%;"></div>
    </div>
    <div style="text-align:center;margin-top:0.5rem;">
      <button id="btn-cancelar-escaner" class="btn-cancelar">❌ Cancelar</button>
    </div>
  `;
  cambiarAVista(html, "📸 Escanear (cuadrado vivo)");

  setTimeout(() => {
    const btnCancel = document.getElementById('btn-cancelar-escaner');

    btnCancel.onclick = () => {
      Quagga.stop();
      mostrarListaProductos();
    };

    // Esperamos a que Quagga esté disponible (CDN o local)
    function iniciarQuagga() {
      if (typeof Quagga === 'undefined') {
        setTimeout(iniciarQuagga, 200);
        return;
      }

      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: document.querySelector('#interactive'),
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment"
          }

        },
        decoder: {
          readers: ["ean_reader", "upc_reader", "code_128_reader", "code_39_reader"]
        },
        locator: { halfSample: true, patchSize: "medium" },
        numOfWorkers: 1,
        frequency: 15
      }, function (err) {
        if (err) {
          console.error(err);
          alert("⚠️ No se pudo abrir la cámara.");
          mostrarListaProductos();
          return;
        }
        Quagga.start();
      });

      // Cuadrado verde en tiempo real
      Quagga.onProcessed(function (result) {
        const drawingCtx = Quagga.canvas.ctx.overlay;
        const drawingCanvas = Quagga.canvas.dom.overlay;
        if (result) {
          drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
          if (result.boxes) {
            result.boxes.filter(box => box !== result.box).forEach(box => {
              Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: "green", lineWidth: 2 });
            });
          }
          if (result.box) {
            Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: "#00FF00", lineWidth: 3 });
          }
        }
      });

      // Auto-lectura
      Quagga.onDetected(function (data) {
        const code = data.codeResult.code;
        Quagga.stop();
        registrarCodigoBarras(code);
      });
    }

    iniciarQuagga();
  }, 300);
}


function mostrarMenuProducto(idProducto) {
  const prod = productos.find(p => p.id === idProducto);
  if (!prod) return;

  const html = `
    <div class="card-dark" style="max-width:360px;margin:auto;">
      <h3 style="margin-bottom:1rem;">📦 ${prod.nombre}</h3>

      <button class="btn"
        onclick="editarProducto(${idProducto})"
        style="width:100%;background:var(--primary);color:white;padding:0.8rem;border-radius:12px;margin-bottom:0.6rem;">
        ✏️ Editar producto
      </button>

      <button class="btn"
        onclick="eliminarProducto(${idProducto})"
        style="width:100%;background:var(--danger);color:white;padding:0.8rem;border-radius:12px;margin-bottom:0.6rem;">
        🗑️ Eliminar producto
      </button>

      <button class="btn"
        onclick="mostrarListaProductos()"
        style="width:100%;background:#6c757d;color:white;padding:0.8rem;border-radius:12px;">
        ← Volver
      </button>
    </div>
  `;

  cambiarAVista(html, "📦 Opciones de producto");
}


function editarProducto(idProducto) {
  const prod = productos.find(p => p.id === idProducto);
  if (!prod) return;

  const html = `
    <form id="form-editar" class="card-form" style="max-width:600px;">
      <label>Nombre: <input type="text" id="edit-nombre" value="${prod.nombre}" style="width:100%;padding:0.5rem;margin:0.5rem 0;"></label><br>
      <label>Categoría: <input type="text" id="edit-categoria" value="${prod.categoria}" style="width:100%;padding:0.5rem;margin:0.5rem 0;"></label><br>
      <label>Punto de reposición: <input type="number" id="edit-reposicion" value="${prod.puntoReposicion}" min="0" style="width:100%;padding:0.5rem;margin:0.5rem 0;"></label><br><br>
      <button type="submit" class="btn" style="background:var(--success);color:white;padding:0.8rem 2rem;border:none;border-radius:12px;">💾 Guardar cambios</button>
      <button type="button" class="btn" onclick="mostrarListaProductos()" style="margin-left:0.5rem;background:#6c757d;color:white;padding:0.8rem 1.5rem;border:none;border-radius:12px;">← Cancelar</button>
    </form>
  `;
  cambiarAVista(html, "✏️ Editar producto");

  setTimeout(() => {
    document.getElementById('form-editar').onsubmit = (e) => {
      e.preventDefault();
      prod.nombre = document.getElementById('edit-nombre').value.trim();
      prod.categoria = document.getElementById('edit-categoria').value.trim();
      prod.puntoReposicion = parseInt(document.getElementById('edit-reposicion').value);
      guardarEnStorage();
      alert('✅ Producto actualizado.');
      mostrarListaProductos();
    };
  }, 200);
}

function eliminarProducto(idProducto) {
  if (!confirm('¿Seguro que querés eliminar este producto? Se borrarán también sus códigos.')) return;

  // Eliminar códigos asociados
  codigos = codigos.filter(c => c.productoId !== idProducto);
  // Eliminar producto
  productos = productos.filter(p => p.id !== idProducto);
  guardarEnStorage();
  alert('🗑️ Producto eliminado.');
  mostrarListaProductos();
}

function toggleBuscador() {
  const input = document.getElementById('buscador');
  input.style.display = input.style.display === 'none' ? 'block' : 'none';
  if (input.style.display === 'block') input.focus();
}


function mostrarListaProductos() {
  const categorias = [...new Set(productos.map(p => p.categoria))].sort();

  const html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.8rem;">
      
      <button class="btn lupa-btn" onclick="toggleBuscador()">
        🔍
      </button>

      <select id="filtro-categoria" class="select-dark">
        <option value="">📁 Todas las categorías</option>
        ${categorias.map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
    </div>

    <input type="text" id="buscador"
      placeholder="Buscar producto..."
      class="input-dark"
      style="display:none;margin-bottom:0.8rem;">

    <div id="lista-productos"></div>
  `;

  cambiarAVista(html, "📦 Productos");

  setTimeout(() => {
    const lista  = document.getElementById('lista-productos');
    const input  = document.getElementById('buscador');
    const select = document.getElementById('filtro-categoria');

    function render() {
      const texto = input.value.toLowerCase();
      const cat   = select.value;

      const filtrados = productos
      .filter(p =>
        (!cat || p.categoria === cat) &&
        (
          p.nombre.toLowerCase().includes(texto) ||
          p.codigo.toLowerCase().includes(texto)
        )
      )
      .sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
      );

      if (filtrados.length === 0) {
        lista.innerHTML = `<p style="text-align:center;color:#888;">No hay productos</p>`;
        return;
      }

      lista.innerHTML = filtrados.map(p => {
        const alerta =
          p.stockActual <= p.puntoReposicion ? 'stock-muy-bajo' :
          p.stockActual <= p.puntoReposicion * 2 ? 'stock-bajo' : '';

        return `
          <div class="producto-item" onclick="mostrarFormularioAjuste(${p.id})">
            
            <img
              id="img-prod-${p.id}"
              class="producto-foto"
              style="width:48px;height:48px;object-fit:cover;border-radius:10px;margin-right:0.6rem;"
            >

            <div style="flex:1;">
              <strong>${p.nombre}</strong><br>
              <small>${p.categoria}${p.codigoVisual ? ` | ${p.codigoVisual}` : ''}</small>
            </div>

            <div class="producto-stock ${alerta}">
              📦 ${p.stockActual}
            </div>

            <button
              onclick="event.stopPropagation(); mostrarMenuProducto(${p.id})"
              class="menu-btn">
              ⋮
            </button>
          </div>
        `;

      }).join('');
    }

    input.oninput = render;
    select.onchange = render;
    render();
    filtrados.forEach(p => {
  if (p.foto) {
    renderProductoFoto(
      document.getElementById(`img-prod-${p.id}`),
      p.id
    );
  }
});
  }, 150);
}

function toast(msg, tipo = "success") {
  const div = document.createElement("div");
  div.textContent = msg;
  div.className = `toast toast-${tipo}`;
  document.body.appendChild(div);

  setTimeout(() => div.classList.add("show"), 50);
  setTimeout(() => {
    div.classList.remove("show");
    setTimeout(() => div.remove(), 300);
  }, 2000);
}

function mostrarFormularioAjuste(idProducto) {
  const prod = productos.find(p => p.id === idProducto);
  if (!prod) {
    alert("Producto no encontrado.");
    return;
  }

  const html = `
    <div class="card-form">
      <p><strong>Código:</strong> ${prod.codigo} | <strong>Categoría:</strong> ${prod.categoria}</p>
      <p>📊 Stock registrado: <strong>${prod.stockActual}</strong></p>

      <form id="form-ajuste">
        <label>
          Stock físico real (contado ahora):
          <input
            type="number"
            id="stock-real"
            placeholder="Stock actual: ${prod.stockActual}"
            min="0"
            style="width:100%;padding:0.5rem;margin:0.5rem 0;"
          >
        </label><br><br>

        <button type="submit" class="btn"
          style="background:var(--success);color:white;padding:0.8rem 2rem;border:none;border-radius:12px;">
          ✅ Confirmar Ajuste
        </button>

        <button type="button" class="btn"
          onclick="mostrarListaProductos()"
          style="background:#6c757d;color:white;padding:0.8rem 1.5rem;border:none;border-radius:12px;margin-left:0.5rem;">
          ← Volver
        </button>
      </form>
    </div>
  `;

  cambiarAVista(html, `🔄 Ajuste: ${prod.nombre}`);

  setTimeout(() => {
    document.getElementById('form-ajuste').onsubmit = (e) => {
      e.preventDefault();

      const input = document.getElementById('stock-real').value.trim();
      if (input === '') {
        alert("⚠️ No ingresaste ningún valor.");
        return;
      }

      const stockReal = parseInt(input);
      const stockAnterior = prod.stockActual;
      const diferencia = stockReal - stockAnterior;

      let tipo = "AJUSTE";
      let cantidad = Math.abs(diferencia);
      if (diferencia > 0) tipo = "ENTRADA";
      if (diferencia < 0) tipo = "SALIDA";

      prod.stockActual = stockReal;

      ajustes.unshift({
        id: Date.now(),
        productoId: prod.id,
        nombreProducto: prod.nombre,
        stockAnterior,
        stockNuevo: stockReal,
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



function exportarSalidas() {
  const salidas = ajustes.filter(a => a.tipo === "SALIDA");

  if (salidas.length === 0) {
    alert("No hay salidas registradas.");
    return;
  }

  const headers = [
    "Fecha",
    "Producto",
    "Cantidad Salida",
    "Stock Anterior",
    "Stock Nuevo",
    "Usuario"
  ];

  const filas = salidas.map(a => [
    new Date(a.fecha).toLocaleString(),
    a.nombreProducto,
    a.cantidad,
    a.stockAnterior,
    a.stockNuevo,
    a.usuario
  ]);

  let csv = headers.join(',') + '\n';
  csv += filas.map(f => f.map(v => `"${v}"`).join(',')).join('\n');

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `salidas_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
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
    return `<tr><td>${fecha}</td><td>${a.nombreProducto}</td><td>${a.stockAnterior} → ${a.stockNuevo}</td><td style="${color}">${diff}</td><td>${a.usuario}</td></tr>`;
  }).join('');
  const html = `
    <div class="card-form" style="overflow-x:auto;">
      <table style="width:100%;min-width:600px;"><thead><tr><th>Fecha/Hora</th><th>Producto</th><th>Stock</th><th>Dif.</th><th>Usuario</th></tr></thead><tbody>${filas}</tbody></table>
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

  normalizarCodigosVisuales(); // 👈

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
