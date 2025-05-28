// Creo base de datos local
const db = new PouchDB('tareas_local');
// La conecto a la base de datos remota
const remoteDB = new PouchDB('http://DAM1:9256@localhost:5984/tareas');

// Sincronización de las bases de datos
db.sync(remoteDB, {
  live: true,
  retry: true
}).on('change', mostrarTareas); // Cuando hay un cambio, actualiza la vista

function añadirTarea() {
  // Consigo el texto escrito
  const texto = document.getElementById('nuevaTarea').value.trim();
  if (!texto) return; // Si no hay texto, no hace nada
  
  const tarea = { // Se crea una tarea con un ID (hecho con fecha y hora)
    _id: new Date().toISOString(),
    texto,
    completada: false
  };
  db.put(tarea); // Se guarda la tarea y se limpia el texto
  document.getElementById('nuevaTarea').value = '';
}

function eliminarTarea(id, rev) { // Elimina la tarea por el ID y la version
  db.remove(id, rev);
}

function marcarTarea(tarea) { // Cambia el estado de completada a no completada y al reves y actualiza las tareas
  tarea.completada = !tarea.completada;
  db.put(tarea).then(() => mostrarTareas()).catch(console.error);
}

function editarTexto(id, rev, nuevoTexto, tarea) { // Edita el texto de la tarea y actualiza las tareas
  if (nuevoTexto.trim() && nuevoTexto !== tarea.texto) {
    tarea.texto = nuevoTexto;
    db.put(tarea).then(() => mostrarTareas()).catch(console.error);
  }
}

function mostrarTareas() { // Muestra las tareas en la lista
  const filtroTexto = document.getElementById("filtroBusqueda").value.toLowerCase();
  const filtroEstado = document.getElementById("filtroEstado").value;

  db.allDocs({ include_docs: true, descending: false }).then((result) => { // Coge todos los docimentos
    const lista = document.getElementById("listaTareas");
    lista.innerHTML = "";

    result.rows
      .map(r => r.doc) 
      .filter(t => t.texto.toLowerCase().includes(filtroTexto)) // Filtro por texto
      .filter(t => // Filtro por estado
        filtroEstado === "todas" ||
        (filtroEstado === "completadas" && t.completada) ||
        (filtroEstado === "pendientes" && !t.completada)
      )
      .forEach(tarea => {
        // Tarjeta para cada tarea
        const card = document.createElement("div");
        card.className = "card card-tarea fade-in";

        const cardBody = document.createElement("div");
        cardBody.className = "card-body d-flex justify-content-between align-items-center";

        // Checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = tarea.completada;
        checkbox.className = "form-check-input me-3";
        checkbox.onchange = () => marcarTarea(tarea);

        // Texto editable
        const textoInput = document.createElement("input");
        textoInput.type = "text";
        textoInput.value = tarea.texto;
        textoInput.className = "input-editable" + (tarea.completada ? " tarea-completada" : "");
        textoInput.onblur = () => editarTexto(tarea._id, tarea._rev, textoInput.value, tarea);
        textoInput.onkeypress = (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            textoInput.blur(); // Se guarda al pulsar enter
          }
        };

        // Botones
        const btnEliminar = document.createElement("button");
        btnEliminar.className = "btn btn-sm btn-outline-danger";
        btnEliminar.innerHTML = '<i class="bi bi-trash"></i>';
        btnEliminar.onclick = () => eliminarTarea(tarea._id, tarea._rev);

        // Agrupar contenido
        const content = document.createElement("div");
        content.className = "d-flex align-items-center flex-grow-1";
        content.appendChild(checkbox);
        content.appendChild(textoInput);

        cardBody.appendChild(content);
        cardBody.appendChild(btnEliminar);
        card.appendChild(cardBody);
        lista.appendChild(card);
      });
  });
}

db.changes({ since: 'now', live: true }).on('change', mostrarTareas);
// Se inicia al cargar la pagina
mostrarTareas();