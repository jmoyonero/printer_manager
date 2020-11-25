"use strict"

import * as Pmgr from './pmgrapi.js'

function listenerGroupTag() {
    $('.badge-group-link').click(function(event) {
        let alias = $(this).text();
        //let printerContainer = $(this).find(".printerItemContainer");
        console.log(alias);
        //updateGroupDetails(searchPrinterByName(alias));    
    });

}

function listenerMenuContextPrinter() {
    //CLIC DERECHO EN IMPRESORAS
    $('.printerItemContainer').on('contextmenu', function(e) {
        var top = e.pageY - 10;
        var left = e.pageX - 90;
        $("#context-menu").css({
            display: "block",
            top: top,
            left: left
        }).addClass("show");
        return false; //blocks default Webbrowser right click menu
    }).on("click", function() {
        $("#context-menu").removeClass("show").hide();
    });

    $("#context-menu a").on("click", function() {
        $(this).parent().removeClass("show").hide();
    });

    $("body").on("click", function() {
        $("#context-menu").removeClass("show").hide();
    });

}



function listenerMenuContextTable() {
    //CLIC DERECHO EN TRABAJOS
    $('#queue').on('contextmenu', function(e) {
        var top = e.pageY - 10;
        var left = e.pageX - 90;
        $("#contextmenuRow").css({
            display: "block",
            top: top,
            left: left
        }).addClass("show");
        return false; //blocks default Webbrowser right click menu
    }).on("click", function() {
        $("#contextmenuRow").removeClass("show").hide();
    });

    $("#contextmenuRow a").on("click", function() {
        $(this).parent().removeClass("show").hide();
    });

    $("body").on("click", function() {
        $("#contextmenuRow").removeClass("show").hide();
    });

}


let groupImageDict = new Object();

function initializeListeners() {
    $(".list-card-item").click(function(event) {

        let alias = $(this).find("h3").text();
        let printerContainer = $(this).find(".printerItemContainer");

        if (printerContainer.length > 0) {
            update(alias, false);
        } else {
            update(alias, true);
        }
    })

    listenerMenuContextPrinter();
    listenerGroupTag();
    listenerMenuContextTable();

}

function update(alias, isGroup) {

    if (isGroup) {
        let group = searchGroupByName(alias);
        updateGroupDetails(group);
        updateGroupQueue(Pmgr.globalState.jobs, getPrintersByIDs(group.printers));
        updatePrintersInGroup(getPrintersByIDs(group.printers));
    } else {
        let printer = searchPrinterByName(alias);
        updatePrinterQueue(Pmgr.globalState.jobs, printer.id);
        updatePrinterDetails(printer);
        updateGroupPrinters(printer);
    }
}

function searchGroupByName(groupName) {
    let groups = Pmgr.globalState.groups;
    let group;
    groups.forEach(g => {
        if (g.name === groupName) {
            group = g;
        }
    });
    return group;
}

function searchPrinterByName(name) {
    let printers = Pmgr.globalState.printers;

    let printer = ""
    let i = 0;
    for (; i < printers.length; i++) {
        if (printers[i].alias === name) {
            printer = printers[i];
            break;
        }
    }
    return printer;
}

function groupsOfPrinter(printer) {
    const printer_id = printer.id;

    let groups_of_printer = [];

    Pmgr.globalState.groups.forEach(function(group, index, array) {

        group.printers.forEach(function(p, i, ar) {
            if (printer_id == p) {
                groups_of_printer.push(group.name);
            }
        });

    });

    return groups_of_printer;
}


function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomImageGroup() {
    let images = ["img/cara_sonriente.png", "img/ucm_logo.png", "img/fdi_logo.png", "img/secretaria_logo.png", "img/fisicas_logo.png"]

    return images[randomInRange(0, (images.length - 1))];
}

// obtiene un listado de impresoras a partir de un listado de identificadores
function getPrintersByIDs(printerIds) {
    let printers = Pmgr.globalState.printers;
    return printers.filter(printer => printerIds.includes(printer.id));
}

// función para actualizar la lista de impresoras dle grupo actual
function updatePrintersInGroup(printers) {
    // vaciamos un contenedor
    $("#printers-in-group").empty();
    printers.forEach(printer => {
        console.log(printer);
        console.log(groupImageDict);
        $("#printers-in-group").append(
            `
            <span id="list-card-item" type="button" class="badge badge-secondary badge-details">${printer.alias}</span>
            `);
    });

    document.addEventListener('click', function(e) {
        if (e.target && e.target.id == 'list-card-item') {
            update(e.srcElement.innerHTML, false);
        }
    });
}

// función para actualizar la cola de impresión de las impresoras
function updatePrinterQueue(jobs, printerID) {
    // vaciamos un contenedor
    $("#queue").empty();
    $("#queue").append(
        `
    <table class="table table-striped fixed_header">
        <thead>
            <tr>
                <th scope="col">ID</th>
                <th scope="col">Documento</th>
                <th scope="col">Propietario</th>
                <th scope="col">Estado</th>
                <th scope="col"></th>
            </tr>
        </thead>
        <tbody id="printerQueueRow">
        </tbody>
    </table>
    `);

    // y lo volvemos a rellenar con su nuevo contenido
    jobs.filter(job => Number(job.printer) === Number(printerID)).forEach(job => {
        $("#printerQueueRow").append(addRowInPrinterQueue(job));
    });
}

// función para actualizar la cola de impresión de los grupos de impresoras
function updateGroupQueue(jobs, printers) {
    // vaciamos un contenedor
    $("#queue").empty();
    $("#queue").append(
        `
    <table class="table table-striped">
        <thead>
            <tr>
                <th scope="col">ID</th>
                <th scope="col">Impresora</th>
                <th scope="col">Documento</th>
                <th scope="col">Propietario</th>
                <th scope="col">Estado</th>
                <th scope="col"></th>
            </tr>
        </thead>
        <tbody id="groupQueueRow">
        </tbody>
    </table>
    `);

    let printerIds = printers.map(p => p.id);

    jobs.filter(j => printerIds.includes(j.printer)).forEach(job => {
        let printer = printers.filter(printer => Number(job.printer) === Number(printer.id))[0];
        $("#groupQueueRow").append(addRowInGroupQueue(job, printer));
    });
}



// añade una fila a la cola de impresoras
function addRowInPrinterQueue(job) {
    return `
    <tr>
        <th scope="row">${job.id}</th>
        <td>${job.fileName}</td>
        <td>${job.owner}</td>
        <td>Imprimiendo</td>
        <td></td>
    </tr> 
    `;
}

// añade una fila a la cola de grupos de impresoras
function addRowInGroupQueue(job, printer) {
    return `
    <tr>
        <th scope="row">${job.id}</th>
        <td>${printer.alias}</td>
        <td>${job.fileName}</td>
        <td>${job.owner}</td>
        <td>Imprimiendo</td>
        <td></td>
    </tr> 
    `;
}

// función para actualizar la cola de impresión de las impresoras, luego se puede extender para que actualice tambien la cola de grupo
function updatePrinterDetails(printer) {
    // vaciamos un contenedor
    $("#printer-name-text").empty();
    $("#printer-location-text").empty();
    $("#printer-model-text").empty();
    $("#printer-ip-text").empty();
    $("#printers-group-list").empty();

    $("#main-image-icon").show();
    $("#printers-in-group").hide();
    $("#printers-in-group-title").hide();


    document.getElementById("printer-name-text").append(printer.alias);
    document.getElementById("printer-location-text").append('Localización: ' + printer.location);
    document.getElementById("printer-model-text").append('Modelo: ' + printer.model);
    document.getElementById("printer-ip-text").append('Dirección IP: ' + printer.ip);

    $("#printer-ip-text").append(`<div class="image-upload">
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
    $("#printer-name-text").empty();
    $("#printer-location-text").empty();
    $("#printer-model-text").empty();
    $("#printer-ip-text").empty();
    $("#printers-group-list").empty();

    $("#main-image-icon").hide()
    $("#printers-in-group").show();
    $("#printers-in-group-title").show();


    $("#printer-name-text").append(group.name);
    document.getElementById("printer-location-text").value = "";
    document.getElementById("printer-model-text").value = "";
    document.getElementById("printer-ip-text").value = "";
    document.getElementById("main-image").src = groupImageDict[group.name][0];
}

function updateGroupPrinters(printers) {
    $("#groups-of-printers").empty();
    let arraysgroups = groupsOfPrinter(printers);
    let allGroups = arraysgroups.map((id) =>
        `<span id="list-card-item" type="button" class="badge badge-secondary badge-details ${groupImageDict[id][1]}">${id}</span>`).join(" ");
    $("#groups-of-printers").append(
        `${allGroups} 
        <div data-toggle="modal" data-target="#new-group-printer">
        <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-plus-circle-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg" type="button" 
         aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <path fill-rule="evenodd" d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3v-3z"/>
        </svg>
        </div>
    `);

    document.addEventListener('click', function(e) {
        if (e.target && e.target.id == 'list-card-item') {
            update(e.srcElement.innerHTML, true);
        }
    });
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


    let allGroups = listOfGroups.slice(0, max_visible_groups).map((id) =>
        `<span class="badge badge-secondary ${groupImageDict[id][1]}">${id}</span>`
    ).join(" ");

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

function createQueue(job, printerID) {
    if (Number(job.printer) === printerID) {
        return `
        <tr>
            <th scope="row">${job.id}</th>
            <td>${job.fileName}</td>
            <td>${job.owner}</td>
            <td>Imprimiendo</td>
            <td></td>
        </tr> 
        `;
    }
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
$(function() {

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