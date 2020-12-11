"use strict"

import * as Pmgr from './pmgrapi.js'

// mapa con las traducciones de los estados de impresoras
let translations = new Map();
translations.set('paused', 'Pausado');
translations.set('no_ink', 'Sin tinta');
translations.set('no_paper', 'Sin papel');
translations.set('printing', 'Imprimiendo');

// lista de urls de imágenes
let imagesPath = new Array();
imagesPath.push("img/cara_sonriente.png")
imagesPath.push("img/ucm_logo.png")
imagesPath.push("img/secretaria_logo.png")
imagesPath.push("img/fdi_logo.png")
imagesPath.push("img/fisicas_logo.png")

// lista de badges
let badgesList = new Array();
for (let i = 0; i < 10; ++i) {
    let badgeClass = "badge-group-" + i;
    badgesList.push(badgeClass)
}

let groupImageDict = new Object();

// inicializa el objeto que relaciona imagen y color de badge a un grupo.
function assignGroupImages() {
    Pmgr.globalState.groups.forEach(group => {
        let randomColorBadge = badgesList[randomInRange(0, badgesList.length - 1)];
        groupImageDict[group.name] = [randomImageGroup(), randomColorBadge];
    })
}

let itemSelectedOnContextMenu;
let idCounter = 1000;

function listenerMenuContextPrinter(obj) {
    //CLIC DERECHO EN IMPRESORAS
    //$('.printerItemContainer').on('contextmenu', function(e) {
    obj.on('contextmenu', function(e) {
        itemSelectedOnContextMenu = $(this);
        let top = e.pageY - 10;
        let left = e.pageX - 90;
        $("#context-menu").css({
            display: "block",
            top: top,
            left: left
        }).addClass("show");
        return false; //blocks default Webbrowser right click menu
    }).on("click", function() {
        $("#context-menu").removeClass("show").hide();
    });
}

function listenerMenuContextTable() {
    //CLIC DERECHO EN TRABAJOS
    $('#queue').on('contextmenu', function(e) {
        let top = e.pageY - 10;
        let left = e.pageX - 90;
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

/*function binIconTableListener() {
    let rowText = $(this).parent().parent().text();
    rowText = rowText.split(/\b\s+/); //[0 --> ID, 1 --> PDF, [2,3,4] --> NOMBRE Y APELLIDOS, 5 --> ESTADO]
    console.log(rowText);

    console.log("El id es: " + rowText[0] + " y el pdf: " + rowText[1]);
}*/

function listenerNewPrinter() {
    $("#button-new-printer").on("click", function() {
        let printer = new Pmgr.Printer();
        // TODO: Usamos una variable global para mantener el número de identificadores generados, esto hasta que funcione el API
        printer.id = idCounter;
        idCounter++;
        printer.alias = $('#input-alias').val();
        printer.location = $('#input-location').val();
        printer.model = $('#input-model').val();
        printer.ip = $('#input-ip').val();

        addPrinter(printer);
    });
}

function listenerNewGroup() {
    $("#button-new-group").on("click", function() {
        let group = new Pmgr.Group();
        group.name = $('#input-name').val();
        group.id = 1001;
        addGroup(group);
    });
}

function listenerAddPrinterToGroup() {
    $("#add-printer-to-group").on("click", function() {
        let groupName = $('#select-printer-groups').val();
        let printerAlias = $('#list-printer-groups').attr("printer-alias");
        addPrinterToGroup(printerAlias, groupName);
    });
}

function listenerUpdatePrinter() {

    updatePrinter();
}

//"list-printer-groups"
function updateDropdownGroupList(printerAlias) {
    $('#list-printer-groups').empty();
    $('#list-printer-groups').attr("printer-alias", `${printerAlias}`);
    Pmgr.globalState.groups.forEach(group => {
        let groupItem = $(`<option>${group.name}</option>`)
        $('#list-printer-groups').append(groupItem);
    });
}

function initializeListeners() {
    // listener para el buscador
    document.addEventListener('input', function(e) {
        if (e.target && e.target.id == 'search') {
            search($('#search').val());
        }
    });

    $("body").on("click", function() {
        $("#context-menu").removeClass("show").hide();
    });
    $("#context-menu a").on("click", function() {
        $(this).parent().removeClass("show").hide();
    });
    //Escuchar las opciones del context menu
    $("#dropdown-pause").on("click", function() {
        let printerSelected = itemSelectedOnContextMenu.find("h3").text();
        let printer = searchPrinterByName(printerSelected);
        if (printer.status === 'printing') {
            printer.status = "paused";
            updatePrinter(printer);
        } else {
            // TODO: Esto debería de ser una modal
            alert("No puedes pausar una impresora que no este imprimiendo.");
        }
    });

    $("#dropdown-cancel").on("click", function() {
        let printerSelected = itemSelectedOnContextMenu.find("h3").text();
        let printer = searchPrinterByName(printerSelected);
        //BORRAR COLA, TODO
    });

    //listenerMenuContextPrinter();
    listenerMenuContextTable();
    listenerNewPrinter();
    listenerNewGroup();
    listenerAddPrinterToGroup();
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
 * API TEMPORAL
 * Funciones para modificar temporalmente el estado global
 ************************************************************************************/

// función para añadir una nueva impresora
function addPrinter(printer) {

    // TODO: ¿Establecemos un estatus estatico a las nuevas impresoras o las generamos aleatoriamente?
    printer.status = 'paused'

    let aux = searchPrinterByName(printer.alias);
    if (aux) {
        // TODO: Cambiemos este alert
        alert('Ya existe una impresora con el alias ' + printer.alias)
    } else {
        Pmgr.globalState.printers.push(printer);
        $("#new-printer").modal('toggle');
    }
    updatePrinterAccordion(Pmgr.globalState.printers);
}

// función para añadir un nuevo grupo
function addGroup(group) {
    let aux = searchGroupByName(group.name);
    if (aux) {
        // TODO: Cambiemos este alert
        alert('Ya existe un grupo con el nombre ' + group.name)
    } else {
        Pmgr.globalState.groups.push(group);
        $("#new-group").modal('toggle');
    }
    let randomColorBadge = badgesList[randomInRange(0, badgesList.length - 1)];
    groupImageDict[group.name] = [randomImageGroup(), randomColorBadge];
    updateGroupAccordion(Pmgr.globalState.groups);
}

// función para añadir una impresora a un nuevo grupo
function addPrinterToGroup(printerAlias, groupName) {

    let printer = searchPrinterByName(printerAlias);
    let group = searchGroupByName(groupName);
    let exist = group.printers.find(p => p === printer.id)
    if (exist) {
        // TODO: Cambiemos este alert
        alert('La impresora ya se encuentra en el grupo ' + group.name)
    } else {
        let index = Pmgr.globalState.groups.findIndex(g => g.name === groupName);
        Pmgr.globalState.groups[index].printers.push(printer.id);
        $("#new-group-printer").modal('toggle');
    }
    updateGroupsOfAPrinter(searchPrinterByName(printerAlias));
    updatePrinterAccordion(Pmgr.globalState.printers);
}

//función para borrar una impresora
function removePrinter(printerAlias) {
    for (let i = 0; i < Pmgr.globalState.printers.length; i++) {
        if (Pmgr.globalState.printers[i].id === printerAlias) {
            Pmgr.globalState.printers.splice(i, 1);
        }
    }
    updatePrinterAccordion(Pmgr.globalState.printers);

    updateQueue(Pmgr.globalState.jobs, Pmgr.resolve(Pmgr.globalState.printers[0].id));
    updatePrinterDetails(Pmgr.resolve(Pmgr.globalState.printers[0].id));
    updateGroupsOfAPrinter(Pmgr.resolve(Pmgr.globalState.printers[0].id));
}

// actualizar datos de una impresora
function updatePrinter(printer) {
    let index = Pmgr.globalState.printers.findIndex(p => p.id === printer.id);
    Pmgr.globalState.printers[index].alias = printer.alias;
    Pmgr.globalState.printers[index].location = printer.location;
    Pmgr.globalState.printers[index].model = printer.model;
    Pmgr.globalState.printers[index].ip = printer.ip;
    Pmgr.globalState.printers[index].status = printer.status;
    updatePrinterAccordion(Pmgr.globalState.printers);
    update(printer.alias, false);
}

// función para desasignar una impresora de un grupo
function removeGroupOfPrinter(printerAlias, groupName) {
    let printer = searchPrinterByName(printerAlias);
    let group = searchGroupByName(groupName);

    let printerIndex = group.printers.findIndex(p => p === printer.id);
    let index = Pmgr.globalState.groups.findIndex(g => g.name === groupName);
    Pmgr.globalState.groups[index].printers.splice(printerIndex, 1);

    updateGroupsOfAPrinter(searchPrinterByName(printerAlias));
    updatePrinterAccordion(Pmgr.globalState.printers)
}

// función para desasignar una impresora de un grupo
function removeJob(jobID, printerAlias) {
    let index = Pmgr.globalState.jobs.findIndex(j => j.id === jobID);
    Pmgr.globalState.jobs.splice(index, 1);
    updateQueue(Pmgr.globalState.jobs, searchPrinterByName(printerAlias));
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

// función buscador - realiza filtros en todos los modelos por el texto recibido por parámetro.
function search(text) {
    // TODO: información inicial en memoria, temporal hasta que podamos usar las apis
    let state = Pmgr.globalState;

    let filteredGroups = state.groups.filter(g => g.name.toLowerCase().search(text.toLowerCase()) != -1);
    let filteredPrinters = state.printers.filter(p =>
        p.alias.toLowerCase().search(text.toLowerCase()) != -1 ||
        p.ip.search(text) != -1 ||
        p.location.toLowerCase().search(text.toLowerCase()) != -1);

    updateGroupAccordion(filteredGroups);
    updatePrinterAccordion(filteredPrinters);
}

/*************************************************************************************
 * ACTUALIZAR VISTA
 * Funciones que actualizan la vista (tablas, eventos, botones, etc)
 ************************************************************************************/
// función para actualizar la cola de impresión
function updateQueue(jobs, printers) {

    let counter = 0;
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
        counter++;
        let tr = $(`<tr>`);
        tr.append(`<td scope = "row" >${job.id} </td>`);
        if (isGroup) {
            tr.append(`<td scope="row"> ${printer.alias}</td>`);
        }
        tr.append(`<td scope="row"> ${job.fileName}</td>`);
        tr.append(`<td scope="row"> ${job.owner}</td>`);
        tr.append(`<td scope="row"> ${translations.get(printer.status)}</td>`);
        let td = $(`<td scope="row">`);
        let div = $('<div class="d-flex justify-content-around">');
        let sendIcon = $(` <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-box-arrow-in-up-right" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" d="M6.364 13.5a.5.5 0 0 0 .5.5H13.5a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 13.5 1h-10A1.5 1.5 0 0 0 2 2.5v6.636a.5.5 0 1 0 1 0V2.5a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H6.864a.5.5 0 0 0-.5.5z"/>
        <path fill-rule="evenodd" d="M11 5.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793l-8.147 8.146a.5.5 0 0 0 .708.708L10 6.707V10.5a.5.5 0 0 0 1 0v-5z"/>
        </svg>`);

        sendIcon.click(function() {
            /*sendJob(job.id, printer.alias);*/
        });

        let trashIcon = $(`<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-trash2-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.037 3.225l1.684 10.104A2 2 0 0 0 5.694 15h4.612a2 2 0 0 0 1.973-1.671l1.684-10.104C13.627 4.224 11.085 5 8 5c-3.086 0-5.627-.776-5.963-1.775z"/>
        <path fill-rule="evenodd" d="M12.9 3c-.18-.14-.497-.307-.974-.466C10.967 2.214 9.58 2 8 2s-2.968.215-3.926.534c-.477.16-.795.327-.975.466.18.14.498.307.975.466C5.032 3.786 6.42 4 8 4s2.967-.215 3.926-.534c.477-.16.795-.327.975-.466zM8 5c3.314 0 6-.895 6-2s-2.686-2-6-2-6 .895-6 2 2.686 2 6 2z"/>
        </svg>
        `);
        trashIcon.click(function() {
            removeJob(job.id, printer.alias);
        });

        div.append(sendIcon);
        div.append(trashIcon);
        td.append(div);
        tr.append(td);
        tr.append('</div></td>');
        queue.append(tr);
    });
    $("#queue-title").empty();
    $("#queue-title").append(`Cola de impresión (${counter})`);
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

    $("#main-image-icon").show();
    $("#printers-in-group").hide();
    $("#printers-in-group-title").hide();

    $("#printer-name-text").append(`<span class="printer-tag-title"> Impresora: </span> <span class="printer-detail-title">${printer.alias}</span> `);

    $("#printer-location-text").append(`<span class="printer-tag-title"> Localización: </span> <span class="printer-detail-title">${printer.location}</span>`);

    $("#printer-model-text").append(`<span class="printer-tag-title"> Modelo: </span> <span class="printer-detail-title">${printer.model}</span>`);

    $("#printer-ip-text").append(`<span class="printer-tag-title"> Dirección IP: </span> <span class="printer-detail-title">${printer.ip}</span>`);

    $('#main-image').attr('src', 'img/win_printer.png');
    $('#main-image-icon').attr('src', `img/status/${printer.status}.png`);
    $('#main-image-icon').attr('title', translations.get(printer.status));

    $("#printers-group-list").append('<h4> Grupos</h4>');
    $("#printers-group-list").append('<div id="groups-of-printers" class=" border border-primary rounded group-tags-container limit-groups-printer"></div>');

    //Botones de editar imprimir y borrar
    let printerButtons = $(`<div class="d-flex justify-content-around">`);
    //Boton editar
    let buttonEdit = $(` <div title="Editar" class="image-upload">
    <svg width="1.75em" height="1.75em" viewBox="0 0 16 16" class="bi bi-pencil-fill" type="button" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
    </svg>
    </div> `);



    //Boton imprimir
    let buttonPrint = $(`<div title="Imprimir" class="image-upload">
    <label for="file-input">
    <svg width="2em" height="2em" viewBox="0 0 16 16" class="bi bi-printer-fill" type="button" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 1a2 2 0 0 0-2 2v1h10V3a2 2 0 0 0-2-2H5z"/>
    <path fill-rule="evenodd" d="M11 9H5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1z"/>
    <path fill-rule="evenodd" d="M0 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1v-2a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2H2a2 2 0 0 1-2-2V7zm2.5 1a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
    </svg>
    </label>
    <input id="file-input" type="file" />
    </div>`);

    //Boton eliminar
    let buttonDelete = $(`<div title="Borrar" class="image-upload">
    <svg width="1.75em" height="1.75em" viewBox="0 0 16 16" class="bi bi-trash-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5a.5.5 0 0 0-1 0v7a.5.5 0 0 0 1 0v-7z"/>
    </svg>
    </div>`);


    let buttonAccept = $(`<div title="Aceptar" class="image-upload">
    <svg width="2em" height="2em" viewBox="0 0 16 16" class="bi bi-check-square-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm10.03 4.97a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
    </svg>
    </div>`);

    let buttonCancel = $(`<div title="Cancelar" class="image-upload">
    <svg width="2em" height="2em" viewBox="0 0 16 16" class="bi bi-x-square-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm3.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
    </svg>
    </div>`);

    buttonDelete.click(function() {
        // TODO: Esto debería de ser una modal
        if (confirm("¿Seguro que quieres borrar la impresora?")) {
            removePrinter(printer.id)
        }
    });

    buttonEdit.click(function() {

        //Esconder los botones principales
        buttonDelete.hide();
        buttonEdit.hide();
        buttonPrint.hide();

        //Mostrar las opciones de cancelar o aceptar las modificaciones
        buttonAccept.show();
        buttonCancel.show();

        //Hacer editable los atributos de la impresora
        $(".printer-detail-title").attr('contenteditable', 'true');
        $(".printer-detail-title").css('color', '#C0C0C0');


    });

    buttonAccept.click(function() {

        //Mostrar los botones principales
        buttonDelete.show();
        buttonEdit.show();
        buttonPrint.show();

        //Esconder las opciones de cancelar o aceptar las modificaciones
        buttonAccept.hide();
        buttonCancel.hide();

        //Hacer NO editable los atributos de la impresora
        $(".printer-detail-title").attr('contenteditable', 'false');
        $(".printer-detail-title").css('color', '#000000');

        let oldName = printer.alias;
        let oldLocation = printer.location;
        let oldModel = printer.model;
        let oldIp = printer.ip;

        printer.alias = $($(".printer-detail-title")[0]).text();
        printer.location = $($(".printer-detail-title")[1]).text();
        printer.model = $($(".printer-detail-title")[2]).text();
        printer.ip = $($(".printer-detail-title")[3]).text();

        if (printer.alias.length === 0 || printer.location.length === 0 || printer.model.length === 0 || printer.ip.length === 0) {
            alert("No se puede r un campo vacío")
            printer.alias = oldName;
            printer.location = oldLocation;
            printer.model = oldModel;
            printer.ip = oldIp;
        }
        updatePrinter(printer)
    });


    buttonCancel.click(function() {
        //Mostrar los botones principales
        buttonDelete.show();
        buttonEdit.show();
        buttonPrint.show();

        //Esconder las opciones de cancelar o aceptar las modificaciones
        buttonAccept.hide();
        buttonCancel.hide();

        //Hacer NO editable los atributos de la impresora
        $(".printer-detail-title").attr('contenteditable', 'false');
        $(".printer-detail-title").css('color', '#000000');

        //Devolverlo al estado principal
        updatePrinter(printer)
    });


    printerButtons.append(buttonAccept);
    printerButtons.append(buttonCancel);
    buttonAccept.hide();
    buttonCancel.hide();
    printerButtons.append(buttonEdit);
    printerButtons.append(buttonPrint);
    printerButtons.append(buttonDelete);
    printerButtons.append(`</div>`);
    $("#printer-ip-text").append(printerButtons);
}

// función para actualizar la cola de impresión de las impresoras, luego se puede extender para que actualice tambien la cola de grupo
function updateGroupDetails(group) {

    // vaciamos un contenedor
    cleanDetails();

    $("#main-image-icon").hide();
    $("#printers-in-group").show();
    $("#printers-in-group-title").show();

    $('#printer-location-text').attr('value', "");
    $('#printer-model-text').attr('value', "");
    $('#printer-ip-text').attr('value', "");
    $('#main-image').attr('src', groupImageDict[group.name][0]);


    $("#printer-name-text").append('<span class="printer-tag-title">Grupo: </span>')
    $("#printer-name-text").append(group.name);
}

// función para actualizar la lista de impresoras del grupo actual
function updatePrintersOfAGroup(printers) {

    $("#printers-in-group").empty();

    printers.forEach(printer => {
        let new_element = $(`<span id="list-card-item-printer" type="button" class="badge badge-secondary badge-details">${printer.alias}</span>`);
        new_element.click(function() {
            update(printer.alias, false)
        });
        $("#printers-in-group").append(new_element).append(' ');
    });
}

function updateGroupsOfAPrinter(printer) {

    $("#groups-of-printers").empty();

    let groups = groupsOfPrinter(printer);
    groups.forEach(group => {
        let mainElement = $(`<div class="width25">`);
        mainElement.click(function() {
            update(group.name, true)
        });

        let removeGroupPrinter = $(`<svg aria-hidden="true" type="button" class="svg-icon iconClearSm" width="14" height="14" viewBox="0 0 14 14"><path d="M12 3.41L10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41z"></path></svg>`);
        removeGroupPrinter.click(function() {
            removeGroupOfPrinter(printer.alias, group.name)
        });
        mainElement.append(removeGroupPrinter);
        mainElement.append(`<span id="list-card-item-group" type="button" class="badge badge-secondary badge-details ${groupImageDict[group.name][1]}">${group.name}</span></div>`);

        $("#groups-of-printers").append(mainElement)
    });

    $("#groups-of-printers").append(
        $(`<div>
                <svg data-toggle="modal" data-target="#new-group-printer" width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-plus-circle-fill" fill="currentColor" xmlns="http://www.w3.org/2000/svg" type="button"
                   aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <path fill-rule="evenodd" d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3v-3z"/>
                </svg>
            </div>`).click(() => updateDropdownGroupList(printer.alias)));
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

// actualiza el acordión de impresoras
function updatePrinterAccordion(printers) {

    $("#printer-accordion-title").empty();
    $("#printer-accordion-title").append(`Impresoras (${printers.length})`);

    $("#accordionImpresoras").empty();

    printers.forEach(printer => {
        let max_visible_groups = 2;

        let listOfGroups = groupsOfPrinter(printer);

        let allGroups = listOfGroups.slice(0, max_visible_groups).map(group => {
            return `<span class="badge badge-secondary ${groupImageDict[group.name][1]}">${group.name}</span>`
        }).join(" ");

        let extra_group = "";
        if (listOfGroups.length > max_visible_groups) {
            extra_group = `<span class="badge badge-secondary">+${listOfGroups.length - max_visible_groups}</span>`
        }

        let mainElement = $(`<div id="printer-button" class="card list-card-item center">`);
        mainElement.click(function() {
            update(printer.alias, false)
        });

        let printerItem = $(`<div class="printerItemContainer">`);
        // printerItem.on(function() {
        listenerMenuContextPrinter(printerItem);
        //})
        printerItem.append(`<img class="card-img-top card-img-left" src="img/win_printer.png" alt="Imagen de la impresora">`);
        printerItem.append(`<h3 class="card-title printer_id">${printer.alias}</h3>`);
        printerItem.append(`<img class="icon" src="img/status/${printer.status}.png" alt="Imagen de la impresora">`);
        printerItem.append(`</span>`);
        printerItem.append(`<p class="groupParagraph">${allGroups} ${extra_group}</p>`);

        mainElement.append(printerItem);

        $("#accordionImpresoras").append(mainElement);
    });
}

// actualiza el acordión de grupos
function updateGroupAccordion(groups) {

    $("#group-accordion-title").empty();
    $("#group-accordion-title").append(`Grupos de Impresoras (${groups.length})`);

    $("#accordionGrupoImpresoras").empty();

    groups.forEach(group => {

        let mainElement = $(`<div class="card list-card-item center">`);
        mainElement.click(function() {
            update(group.name, true)
        });

        let groupItem = $(`<div class="img_group">`);
        groupItem.append(`<img class="card-img-right" src="${groupImageDict[group.name][0]}" alt="Imagen del Grupo">`);

        mainElement.append(groupItem);
        mainElement.append(`<h3 class="card-title">${group.name}</h3>`);

        $("#accordionGrupoImpresoras").append(mainElement);
    });
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

            assignGroupImages();
            updateGroupAccordion(Pmgr.globalState.groups);
            updatePrinterAccordion(Pmgr.globalState.printers);

            showDetails();
            updateQueue(Pmgr.globalState.jobs, Pmgr.resolve(0));
            updatePrinterDetails(Pmgr.resolve(0));
            updateGroupsOfAPrinter(Pmgr.resolve(0));

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

// window.createPrinterItem = createPrinterItemupdater.locatio ""deja