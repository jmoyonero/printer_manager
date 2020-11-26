"use strict"

import * as Pmgr from './pmgrapi.js'

// mapa con las traducciones de los estados de impresoras
let translations = new Map();
translations.set('paused', 'pausado');
translations.set('no_ink', 'sin tinta');
translations.set('no_paper', 'sin papel');
translations.set('printing', 'imprimiendo');

// lista de urls de imágenes
let imagesPath = new Array();
imagesPath.push("img/cara_sonriente.png")
imagesPath.push("img/ucm_logo.png")
imagesPath.push("img/secretaria_logo.png")
imagesPath.push("img/fdi_logo.png")
imagesPath.push("img/fisicas_logo.png")

let groupImageDict = new Object();

function listenerMenuContextPrinter() {
    //CLIC DERECHO EN IMPRESORAS
    $('.printerItemContainer').on('contextmenu', function (e) {
        var top = e.pageY - 10;
        var left = e.pageX - 90;
        $("#context-menu").css({
            display: "block",
            top: top,
            left: left
        }).addClass("show");
        return false; //blocks default Webbrowser right click menu
    }).on("click", function () {
        $("#context-menu").removeClass("show").hide();
    });

    $("#context-menu a").on("click", function () {
        $(this).parent().removeClass("show").hide();
    });

    $("body").on("click", function () {
        $("#context-menu").removeClass("show").hide();
    });
}

function listenerMenuContextTable() {
    //CLIC DERECHO EN TRABAJOS
    $('#queue').on('contextmenu', function (e) {
        var top = e.pageY - 10;
        var left = e.pageX - 90;
        $("#contextmenuRow").css({
            display: "block",
            top: top,
            left: left
        }).addClass("show");
        return false; //blocks default Webbrowser right click menu
    }).on("click", function () {
        $("#contextmenuRow").removeClass("show").hide();
    });

    $("#contextmenuRow a").on("click", function () {
        $(this).parent().removeClass("show").hide();
    });

    $("body").on("click", function () {
        $("#contextmenuRow").removeClass("show").hide();
    });
}

function initializeListeners() {
    $(".list-card-item").click(function (event) {

        let alias = $(this).find("h3").text();
        let printerContainer = $(this).find(".printerItemContainer");

        if (printerContainer.length > 0) {
            update(alias, false);
        } else {
            update(alias, true);
        }
    })

    // listener para las impresoras en un grupo de impresoras
    document.addEventListener('click', function (e) {
        if (e.target && e.target.id == 'list-card-item-printer') {
            update(e.srcElement.innerHTML, false);
        }
    });

    // listener para los grupos de una impresora
    document.addEventListener('click', function (e) {
        if (e.target && e.target.id == 'list-card-item-group') {
            update(e.srcElement.innerHTML, true);
        }
    });

    listenerMenuContextPrinter();
    listenerMenuContextTable();
}

function update(alias, isGroup) {

    showDetails();

    if (isGroup) {
        let group = searchGroupByName(alias);
        updateGroupDetails(group);
        updateQueue(Pmgr.globalState.jobs, getPrintersByIDs(group.printers));
        updatePrintersOfAGroup(getPrintersByIDs(group.printers));
    } else {
        let printer = searchPrinterByName(alias);
        updateQueue(Pmgr.globalState.jobs, printer);
        updatePrinterDetails(printer);
        updateGroupsOfAPrinter(printer);
    }
}

/*************************************************************************************
 * OBTENER INFORMACION
 * Funciones de ayuda
 ************************************************************************************/

// función que devuelve un grupo a partir de su nombre
function searchGroupByName(name) {
    // TODO: información inicial en memoria, temporal hasta que podamos usar las apis
    let groups = Pmgr.globalState.groups;
    return groups.find(g => g.name === name);
}

// función que devuelve una impresora a partir de su nombre
function searchPrinterByName(name) {
    // TODO: información inicial en memoria, temporal hasta que podamos usar las apis
    let printers = Pmgr.globalState.printers;
    return printers.find(p => p.alias === name);
}

// función que devuelve una lista con los grupos en los que se encuentra una impresora
function groupsOfPrinter(printer) {
    // TODO: información inicial en memoria, temporal hasta que podamos usar las apis
    let groups = Pmgr.globalState.groups;
    return groups.filter(group => group.printers.includes(printer.id))
}

// función que retorna un listado de impresoras a partir de un listado de identificadores
function getPrintersByIDs(printerIds) {
    // TODO: información inicial en memoria, temporal hasta que podamos usar las apis
    let printers = Pmgr.globalState.printers;
    return printers.filter(printer => printerIds.includes(printer.id));
}

// retorna un número aleatorio entre un mínimo y máximo
function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

// retorna una ruta de imagen aleatoria
function randomImageGroup() {
    return imagesPath[randomInRange(0, imagesPath.length - 1)];
}

/*************************************************************************************
 * ACTUALIZAR VISTA
 * Funciones que actualizan la vista (tablas, eventos, botones, etc)
 ************************************************************************************/
// función para actualizar la cola de impresión
function updateQueue(jobs, printers) {

    // obtenemos el contenedor
    let queue = $("#queue-body");

    // limpiamos el contenedor
    queue.empty();

    let column = document.getElementById("printer-column");

    let isGroup = Array.isArray(printers);
    if (isGroup) {
        column.classList.remove("d-none")
    } else {
        printers = [printers];
        column.classList.add("d-none")
    }

    // obtenemos una lista con los ids de las impresoras a partir de la lista de impresoras
    let printerIds = printers.map(p => p.id);

    jobs.filter(j => printerIds.includes(j.printer)).forEach(job => {
            let printer = printers.filter(printer => job.printer === printer.id)[0];
            queue.append(`<tr>`);
            queue.append(`<td scope="row">${job.id}</td>`);
            if (isGroup) {
                queue.append(`<td scope="row">${printer.alias}</td>`);
            }
            queue.append(`<td scope="row">${job.fileName}</td>`);
            queue.append(`<td scope="row">${job.owner}</td>`);
            queue.append(`<td scope="row">${translations.get(printer.status)}</td>`);
            queue.append(`<td scope="row"></td>`);
            queue.append(`</tr>`);
        }
    );
}

function cleanDetails() {
    $("#printer-name-text").empty();
    $("#printer-location-text").empty();
    $("#printer-model-text").empty();
    $("#printer-ip-text").empty();
    $("#printers-group-list").empty();
}

// actualiza los detalles de la impresora
function updatePrinterDetails(printer) {

    cleanDetails();

    //$("#main-image-icon").show();
    //$("#printers-group-list").hide();
    document.getElementById("main-image-icon").classList.remove("d-none");
    document.getElementById("printers-group-list").classList.remove("d-none");

    //$("#printers-in-group").hide();
    //$("#printers-in-group-title").hide();

    document.getElementById("printer-name-text").append(printer.alias);
    document.getElementById("printer-location-text").append('Localización: ' + printer.location);
    document.getElementById("printer-model-text").append('Modelo: ' + printer.model);
    document.getElementById("printer-ip-text").append('Dirección IP: ' + printer.ip);

    $("#printer-ip-text").append(
        `<div class="image-upload">
    <label for="file-input">
    <svg width="2em" height="2em" viewBox="0 0 16 16" class="bi bi-printer-fill" type="button" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 1a2 2 0 0 0-2 2v1h10V3a2 2 0 0 0-2-2H5z"/>
    <path fill-rule="evenodd" d="M11 9H5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1z"/>
    <path fill-rule="evenodd" d="M0 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1v-2a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2H2a2 2 0 0 1-2-2V7zm2.5 1a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
    </svg>
    </label>
    <input id="file-input" type="file" />
    </div>
    `);

    document.getElementById("main-image").src = "img/win_printer.png";
    document.getElementById("main-image-icon").src = `img/status/${printer.status}.png`;
    $("#printers-group-list").append(`
    <h4> Grupos</h4>
    <div id="groups-of-printers" class="border border-primary rounded group-tags-container limit-groups-printer"></div>`);

}

// función para actualizar la cola de impresión de las impresoras, luego se puede extender para que actualice tambien la cola de grupo
function updateGroupDetails(group) {
    // vaciamos un contenedor
    cleanDetails();

    // $("#main-image-icon").hide();
    document.getElementById("main-image-icon").classList.add("d-none");
    document.getElementById("printers-group-list").classList.add("d-none");

    // $("#printers-in-group").show();
    //$("#printers-in-group-title").show();

    $("#printer-name-text").append(group.name);
    document.getElementById("printer-location-text").value = "";
    document.getElementById("printer-model-text").value = "";
    document.getElementById("printer-ip-text").value = "";
    document.getElementById("main-image").src = groupImageDict[group.name][0];
}

// función para actualizar la lista de impresoras del grupo actual
function updatePrintersOfAGroup(printers) {

    // limpiamos el contenedor
    $("#printers-in-group").empty();

    printers.forEach(printer => {
        $("#printers-in-group").append(
            `<span id="list-card-item-printer" type="button" class="badge badge-secondary badge-details">${printer.alias}</span> `);
    });
}

function updateGroupsOfAPrinter(printers) {
    $("#groups-of-printers").empty();
    let arraysgroups = groupsOfPrinter(printers);
    let allGroups = arraysgroups.map((group) =>
        `<span id="list-card-item-group" type="button" class="badge badge-secondary badge-details ${groupImageDict[group.name][1]}">${group.name}</span>`).join(" ");
    $("#groups-of-printers").append(
        `${allGroups}
    <div data-toggle="modal" data-target="#new-group-printer">
    <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-plus-circle-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg" type="button"
    aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
    <path fill-rule="evenodd" d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3v-3z"/>
    </svg>
    </div>
    `);
}

// función para mostrar los detalles de impresoras o grupos de impresoras
function showDetails() {
    document.getElementById("main-screen-container").classList.remove("d-none");
}

/**
 * Librería de cliente para interaccionar con el servidor de PrinterManager (prmgr).
 * Prácticas de IU 2020-21
 *
 * Para las prácticas de IU, pon aquí (o en otros js externos incluidos desde tus .htmls) el código
 * necesario para añadir comportamientos a tus páginas. Recomiendo separar el fichero en 2 partes:
 * - funciones que pueden generar cachos de contenido a partir del modelo, pero que no
 *   tienen referencias directas a la página
 * - un bloque rodeado de $(() => { y } donde está el código de pegamento que asocia comportamientos
 *   de la parte anterior con elementos de la página.
 *
 * Fuera de las prácticas, lee la licencia: dice lo que puedes hacer con él, que es esencialmente
 * lo que quieras siempre y cuando no digas que lo escribiste tú o me persigas por haberlo escrito mal.
 */

//
// PARTE 1:
// Código de comportamiento, que sólo se llama desde consola (para probarlo) o desde la parte 2,
// en respuesta a algún evento.
//

function createPrinterItem(printer) {
    const rid = 'x_' + Math.floor(Math.random() * 1000000);
    const hid = 'h_' + rid;
    const cid = 'c_' + rid;

    // usar [] en las claves las evalua (ver https://stackoverflow.com/a/19837961/15472)
    const PS = Pmgr.PrinterStates;
    let pillClass = {
        [PS.PAUSED]: "badge-secondary",
        [PS.PRINTING]: "badge-success",
        [PS.NO_INK]: "badge-danger",
        [PS.NO_PAPER]: "badge-danger"
    };


    let max_visible_groups = 2;

    let allJobs = printer.queue.map((id) =>
        `<span class="badge badge-secondary">${id}</span>`
    ).join(" ");

    let listOfGroups = groupsOfPrinter(printer);

    let allGroups = listOfGroups.slice(0, max_visible_groups).map(group => {
        return `<span class="badge badge-secondary ${groupImageDict[group.name][1]}">${group.name}</span>`
    }).join(" ");

    let extra_group = "";
    if (listOfGroups.length > max_visible_groups) {
        extra_group = `<span class="badge badge-secondary">...</span>`
    }

    return `
    <div class="card list-card-item center">
    <div class="printerItemContainer">
    <img class="card-img-top card-img-left" src="img/win_printer.png" alt="Imagen de la impresora">
    <h3 class="card-title printer_id">${printer.alias}</h3>
    <img class="icon" src="img/status/${printer.status}.png" alt="Imagen de la impresora">
    </span>
    <p class="groupParagraph">${allGroups} ${extra_group}</p>
    </div>
    </div>
    `;

}


function createGroupItem(group) {
    const rid = 'gx_' + Math.floor(Math.random() * 1000000);
    const hid = 'gh_' + rid;
    const cid = 'gc_' + rid;

    let groupBadge = ["badge-group-1", "badge-group-2", "badge-group-3", "badge-group-4"];
    let ramdomColorBadge = groupBadge[randomInRange(0, groupBadge.length - 1)];

    groupImageDict[group.name] = [randomImageGroup(), ramdomColorBadge];

    return `
    <div class="card list-card-item center">
    <div class="img_group">
    <img class="card-img-right" src="${groupImageDict[group.name][0]}" alt="Imagen del Grupo">
    </div>
    <h3 class="card-title">${group.name}</h3>
    </div>
    `;
}

// funcion para generar datos de ejemplo: impresoras, grupos, trabajos, ...
// se puede no-usar, o modificar libremente
async function populate(minPrinters, maxPrinters, minGroups, maxGroups, jobCount) {
    const U = Pmgr.Util;

    // genera datos de ejemplo
    minPrinters = minPrinters || 10;
    maxPrinters = maxPrinters || 20;
    minGroups = minGroups || 1;
    maxGroups = maxGroups || 3;
    jobCount = jobCount || 100;
    let lastId = 0;

    let printers = U.fill(U.randomInRange(minPrinters, maxPrinters),
        () => U.randomPrinter(lastId++));

    let groups = U.fill(U.randomInRange(minPrinters, maxPrinters),
        () => U.randomGroup(lastId++, printers, 50));

    let jobs = [];
    for (let i = 0; i < jobCount; i++) {
        let p = U.randomChoice(printers);
        let j = new Pmgr.Job(lastId++,
            p.id, [
                U.randomChoice([
                    "Alice", "Bob", "Carol", "Daryl", "Eduardo", "Facundo", "Gloria", "Humberto"
                ]),
                U.randomChoice([
                    "Fernández", "García", "Pérez", "Giménez", "Hervás", "Haya", "McEnroe"
                ]),
                U.randomChoice([
                    "López", "Gutiérrez", "Pérez", "del Oso", "Anzúa", "Báñez", "Harris"
                ]),
            ].join(" "),
            U.randomString() + ".pdf");
        p.queue.push(j.id);
        jobs.push(j);
    }

    if (Pmgr.globalState.token) {
        console.log("Updating server with all-new data");

        // FIXME: remove old data
        // FIXME: prepare update-tasks
        let tasks = [];
        for (let t of tasks) {
            try {
                console.log("Starting a task ...");
                await t().then(console.log("task finished!"));
            } catch (e) {
                console.log("ABORTED DUE TO ", e);
            }
        }
    } else {
        console.log("Local update - not connected to server");
        Pmgr.updateState({
            jobs: jobs,
            printers: printers,
            groups: groups
        });
    }
}

//
// PARTE 2:
// Código de pegamento, ejecutado sólo una vez que la interfaz esté cargada.
// Generalmente de la forma $("selector").cosaQueSucede(...)
//
$(function () {

    // funcion de actualización de ejemplo. Llámala para refrescar interfaz
    function update(result) {
        try {
            //HEMOS EL ORDEN PARA PODER INICIALZIAR LOS GRUPOS

            // vaciamos un contenedor
            $("#accordionGrupoImpresoras").empty();
            // y lo volvemos a rellenar con su nuevo contenido
            Pmgr.globalState.groups.forEach(m => $("#accordionGrupoImpresoras").append(createGroupItem(m)));


            // vaciamos un contenedor
            $("#accordionImpresoras").empty();
            // y lo volvemos a rellenar con su nuevo contenido
            Pmgr.globalState.printers.forEach(m => $("#accordionImpresoras").append(createPrinterItem(m)));
            // y asi para cada cosa que pueda haber cambiado


            initializeListeners(); //Función con todas la funcionalidad necesaria para el funcionamiento de la interfaz (colocada aqui por evitar los problemas de la API)

        } catch (e) {
            console.log('Error actualizando', e);
        }
    }

    // Servidor a utilizar. También puedes lanzar tú el tuyo en local (instrucciones en Github)
    const serverUrl = "http://127.0.0.1:8080/api/" //"http://localhost:8080/api/";
    Pmgr.connect(serverUrl);

    // ejemplo de login
    Pmgr.login("HDY0IQ", "cMbwKQ").then(d => {
        if (d !== undefined) {
            const u = Gb.resolve("HDY0IQ");
            console.log("login ok!", u);
        } else {
            console.log(`error en login (revisa la URL: ${serverUrl}, y verifica que está vivo)`);
            console.log("Generando datos de ejemplo para uso en local...")

            populate();

            update();
        }
    });
});


// cosas que exponemos para usarlas desde la consola
window.populate = populate
window.Pmgr = Pmgr;
window.createPrinterItem = createPrinterItemupdate