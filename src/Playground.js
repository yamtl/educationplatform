import 'ace-builds/src-min-noconflict/ace';
import 'ace-builds/src-min-noconflict/theme-eclipse';
import 'ace-builds/src-min-noconflict/mode-xml';
import 'ace-builds/src-min-noconflict/mode-yaml';
import 'ace-builds/src-min-noconflict/mode-java';
import 'ace-builds/src-min-noconflict/mode-html';
import 'ace-builds/src-min-noconflict/ext-modelist';

import svgPanZoom from 'svg-pan-zoom';

import { ModelPanel } from './ModelPanel.js';
import { ConsolePanel } from "./ConsolePanel.js";
import { ProgramPanel } from "./ProgramPanel.js";
import { OutputPanel } from "./OutputPanel.js";

//import { ExampleManager } from './ExampleManager.js';
import { ActivityManager } from './ActivityManager.js';

import { DownloadDialog } from './DownloadDialog.js';
import { MetamodelPanel } from './MetamodelPanel.js';
import { SettingsDialog } from './SettingsDialog.js';
import { Preloader } from './Preloader.js';
import { Backend } from './Backend.js';
import { Layout } from './Layout.js';
import 'metro4';
import './highlighting/highlighting.js';
import { TestPanel } from './TestPanel .js';
import { ToolManager as ToolsManager } from './ToolsManager.js';



export var language = "eol";
var outputType = "text";
var outputLanguage = "text";
var activity;
var url = window.location + "";
var questionMark = url.indexOf("?");

export var programPanel = new ProgramPanel();
export var secondProgramPanel = new ProgramPanel("secondProgram");
export var firstMetamodelPanel = new MetamodelPanel("firstMetamodel");
export var secondMetamodelPanel = new MetamodelPanel("secondMetamodel");
export var firstModelPanel = new ModelPanel("firstModel", true, firstMetamodelPanel);
export var secondModelPanel;
export var thirdModelPanel;

export var consolePanel;
var downloadDialog = new DownloadDialog();
var settingsDialog = new SettingsDialog();
var preloader = new Preloader();
export var backend = new Backend();


export var examplesManager = new ActivityManager();
export var toolsManager = new ToolsManager( examplesManager.getToolUrls() );
//export var examplesManager = new ExampleManager();


var panels = [];

// Now handled by ToolManager
//backend.configure();


//example = examplesManager.getSelectedExample();
activity = examplesManager.getSelectedActivity(); 
setup();

function setup() {
    const toolPanelDefinitionId = examplesManager.getPanelRefId(activity.actions[0].source); // Source panel refernces a tool panel definition
    language = toolsManager.getPanelDefinition(toolPanelDefinitionId).language; // Use the source from config file 

  
   /* if (activity.eol != null) { 
        activity.program = activity.eol; language = "eol";
    }
    else {
        language = activity.language
    }; */
    
    console.log("Language: " + language);

    if (activity.outputType != null) {
        outputType = activity.outputType;
    }
    
    if (activity.outputLanguage != null) {
        outputLanguage = activity.outputLanguage;
    }
    
    var secondModelEditable = !(language == "etl" || language == "flock");

    secondModelPanel = new ModelPanel("secondModel", secondModelEditable, secondMetamodelPanel);
    thirdModelPanel = {}// new OutputPanel("thirdModel", language, outputType, outputLanguage);

    // Generalised and moved to after creation of activity panels
    //new Layout().create("navview-content", language);
    
    //panels = [programPanel, secondProgramPanel, consolePanel, firstModelPanel, firstMetamodelPanel, secondModelPanel, secondMetamodelPanel, thirdModelPanel];
    
    // Create panels for the given activites
    
      var debug = new TestPanel("debugp");

    for ( let apanel of activity.panels ){
        
        //var newPanel= new TestPanel(apanel.id); // Coloured test panels

        // Get the panel to creates associated definition from the tool config and create the panel
        const newPanelDef = toolsManager.getPanelDefinition(apanel.ref);

  

        if (newPanelDef != null){
            
            //var newPanel = new [newPanelDef.panelclass](apanel.id);     
            
            var newPanel;

            // TODO Populate the different panel types from the tool panel definition.
            switch(newPanelDef.panelclass) {
                case "ProgramPanel":
                    newPanel =  new ProgramPanel(apanel.id);

                    // Set from the tool panel  
                    newPanel.setIcon(newPanelDef.icon);
                    newPanel.setMode(newPanelDef.language, examplesManager.panelHasAction(newPanel.id));
                    //TODO add panel button function

                    // Set from the activity 
                    newPanel.setValue(apanel.file); 
                  break;
               
                case "ConsolePanel":
                    newPanel =  new ConsolePanel(apanel.id);

                    // TODO Support for multiple consoles
                    consolePanel = newPanel; 
                   break;

                case "OutputPanel":
                
                    const panelDef =  toolsManager.getPanelDefinition(apanel.id);

                    newPanel =  new OutputPanel(apanel.id, language, outputType, outputLanguage);
                
                    newPanel.setIcon(newPanelDef.icon);
                    
                    newPanel.hideEditor();
                    newPanel.showDiagram();

                  break;

                  // TODO create other panel types e.g. models and metamodels so the text is formatted correctly
                default:
                   newPanel = new TestPanel(apanel.id);
              }
            
            newPanel.setTitle(apanel.name);

            

            panels.push(newPanel);
        }
        
    }
        

    new Layout().createFromPanels("navview-content", panels);
    

    arrangePanels();

    //TODO: Fix "undefined" when fields are empty
    
    /* Setting the contents of the editors

    programPanel.setLanguage(language);
    if (language == "egx") secondProgramPanel.setLanguage("egl");

    programPanel.setValue(example.program);
    secondProgramPanel.setValue(example.secondProgram);
    firstModelPanel.setValue(example.flexmi);
    firstMetamodelPanel.setValue(example.emfatic);
    secondModelPanel.setValue(example.secondFlexmi);
    secondMetamodelPanel.setValue(example.secondEmfatic);
    */

    document.getElementById("navview").style.display = "block";
    
    document.addEventListener('click', function(evt) {
        if (evt.target == document.getElementById("toggleNavViewPane")) {
            setTimeout(function(){ fit(); }, 1000);
        }
    });

    $(window).keydown(function(event) {
      if ((event.metaKey && event.keyCode == 83) || (event.ctrlKey && event.keyCode == 83)) { 
        runProgram();
        event.preventDefault(); 
      }
    });

    Metro.init();

    //examplesManager.openActiveExamplesSubMenu();
    examplesManager.openActiveActivitiesSubMenu();
    
    fit();
}


function copyShortenedLink(event) {
    event.preventDefault();
    var content = btoa(editorsToJson());
    var xhr = new XMLHttpRequest();
    
    xhr.open("POST", backend.getShortURLService(), true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var json = JSON.parse(xhr.responseText);

                if (questionMark > 0) {
                    var baseUrl = (window.location+"").substring(0, questionMark);
                }
                else {
                    baseUrl = window.location;
                }
                Metro.notify.killAll();
                Metro.dialog.create({
                    title: "Share link",
                    content: "<p>The link below contains a snapshot of the contents of all the editors in the playground. Anyone who visits this link should be able to view and run your example.</p><br/> <input style='width:100%' value='" + baseUrl + "?" + json.shortened + "'>",
                    closeButton: true,
                    actions: [
                    {
                        caption: "Copy to clipboard",
                        cls: "js-dialog-close success",
                        onclick: function(){
                            copyToClipboard(baseUrl + "?" + json.shortened);
                        }
                    }]
                });
            }
            Metro.notify.killAll();
        }
    };
    var data = JSON.stringify({"content": content});
    xhr.send(data);
    longNotification("Generating short link");
    return false;
}

function copyToClipboard(str) {
    var el = document.createElement('textarea');
    el.value = str;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

function arrangePanels() {



    /*
    if (language == "egl" || language == "egx") {
        if (outputType == "dot") {
            thirdModelPanel.showDiagram();
            thirdModelPanel.setTitleAndIcon("Graphviz", "diagram");
        }
        else if (outputType == "html") {
            thirdModelPanel.showDiagram();
            thirdModelPanel.setTitleAndIcon("HTML", "html");
        }
        else if (outputType == "puml") {
            thirdModelPanel.showDiagram();
            thirdModelPanel.setTitleAndIcon("PlantUML", "diagram");
        }
        else if (outputType == "code") {
            $("#thirdModelDiagram").hide();
            $("#thirdModelEditor").show();
            thirdModelPanel.setTitleAndIcon("Generated Text", "editor");           
        }
    }
    else if (language == "etl") {
        $("#secondModelDiagram").show();
        $("#secondModelEditor").hide();

        firstModelPanel.setTitle("Source Model");
        firstMetamodelPanel.setTitle("Source Metamodel");
        secondModelPanel.setTitle("Target Model");
        secondMetamodelPanel.setTitle("Target Metamodel");
        secondModelPanel.setIcon("diagram");
    }
    else if (language == "flock") {
        $("#secondModelDiagram").show();
        $("#secondModelEditor").hide();

        firstModelPanel.setTitle("Original Model");
        firstMetamodelPanel.setTitle("Original Metamodel");
        secondModelPanel.setTitle("Migrated Model");
        secondMetamodelPanel.setTitle("Evolved Metamodel");
        secondModelPanel.setIcon("diagram");
    }
    else if (language == "evl" || language == "epl") {
        $("#thirdModelDiagram").show();
        if (language == "evl") {
            thirdModelPanel.setTitleAndIcon("Problems", "problems");
        }
        else {
            thirdModelPanel.setTitleAndIcon("Pattern Matches", "diagram");
        }
    }
*/

}

function getPanelTitle(panelId) {
    return $("#" + panelId)[0].dataset.titleCaption;
}

function editorsToJsonObject() {
    var actionRequestData = {};

    

    /* TODO support multiple actions - need to know the button pressed here we just 
    use the first one in the current activity. */
    const currentAction = activity.actions[0];
       
    // Lookup the target actionfunction  via the source activity action panel reference 
    const toolPanelDefinitionId = examplesManager.getPanelRefId(currentAction.source); // Source panel refernces a tool panel definition
    const actionFunctionId = toolsManager.getPanelDefinition(toolPanelDefinitionId).actionFunction; // Panel definition has the id of th tool function 
    
    const actionFunction = toolsManager.getActionFunction(actionFunctionId);
    const panelDefinitionLanguage = toolsManager.getPanelDefinition(toolPanelDefinitionId).language; 



    //Populate the parameters for processing the action request
    for ( const param  of actionFunction.parameters ){

        // Get editor values from their panels
        const panelId = currentAction.parameters[param]; 
        const panel = panels.find( pn => pn.id ==  panelId );

        if (panelId == undefined){
            // Set unused parameters in the request to undefined as the backend function expect them all. 
            actionRequestData[param] = "undefined";

        } else if (panel != undefined){
            // There is a panel so add its contents to request
            actionRequestData[param] = panel.getValue();

        } else {
            console.log("Panel id '" + panelId +  "' not found when building request.")
        }
    }


    actionRequestData.language = panelDefinitionLanguage;
    
    // TODO support output and language 
    actionRequestData.outputType = outputType;
    actionRequestData.outputLanguage = outputLanguage;

    return  actionRequestData; 
    
    /*{
            language = language;
            "outputType": outputType,
        "outputLanguage": outputLanguage,
        "program": programPanel.getValue(), 
        "secondProgram": secondProgramPanel.getValue(),
        "emfatic": firstMetamodelPanel.getValue(), 
        "flexmi": firstModelPanel.getValue(),
        "secondEmfatic": secondMetamodelPanel.getValue(),
        "secondFlexmi": secondModelPanel.getValue()
    }; */
}



function editorsToJson() {
    return JSON.stringify(editorsToJsonObject());
}

function fit() {
    
    var splitter = document.getElementById("splitter");
    splitter.style.minHeight = window.innerHeight + "px";
    splitter.style.maxHeight = window.innerHeight + "px";

    panels.forEach(panel => panel.fit());
    preloader.hide();
}

function runProgram() {
	
//----- TODO Consolidate this duplicated code for testing from editorsToJsonObject 
const currentAction = activity.actions[0];
       
// Lookup the target actionfunction  via the source activity action panel reference 
const toolPanelDefinitionId = examplesManager.getPanelRefId(currentAction.source); // Source panel refernces a tool panel definition
const actionFunctionId = toolsManager.getPanelDefinition(toolPanelDefinitionId).actionFunction; // Panel definition has the id of th tool function 
const language = toolsManager.getPanelDefinition(toolPanelDefinitionId).language; // Use the source from config file 
const actionFunction = toolsManager.getActionFunction(actionFunctionId);
//------
const outputPanel = panels.find(pn => pn.id == currentAction.output);

    var xhr = new XMLHttpRequest();
    //var url = backend.getRunEpsilonService();
    var url = actionFunction.path;

    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                console.log(response);

                if (response.hasOwnProperty("error")) {
                    consolePanel.setError(response.error);
                }
                else {
                    consolePanel.setOutput(response.output);
                    
                    if (language == "etl" || language == "flock") {
                        outputPanel.hideEditor(); // TODO Showing diagram before and after renderDiagrams makes outputs image show in panel otherwise nothing. 
                        outputPanel.showDiagram();
                        outputPanel.renderDiagram(response.targetModelDiagram);
                        outputPanel.showDiagram();
                    }
                    else if (language == "evl") {
                        outputPanel.hideEditor();
                        outputPanel.showDiagram();
                        outputPanel.renderDiagram(response.validatedModelDiagram); //Use the output panel id.
                        outputPanel.showDiagram();
                    }
                    else if (language == "epl") {
                        outputPanel.renderDiagram(response.patternMatchedModelDiagram); //Use the output panel id.
                    }
                    else if (language == "egx") {
                        thirdModelPanel.setGeneratedFiles(response.generatedFiles);
                        consolePanel.setOutput(response.output);
                    }
                    else if (language == "egl") {
                        if (outputType == "code") {
                            thirdModelPanel.getEditor().setValue(response.generatedText.trim(), 1);
                            consolePanel.setOutput(response.output);
                        }
                        else if (outputType == "html") {
                            consolePanel.setOutput(response.output);
                            var iframe = document.getElementById("htmlIframe");
                            if (iframe == null) {
                                iframe = document.createElement("iframe");
                                iframe.id = "htmlIframe"
                                iframe.style.height = "100%";
                                iframe.style.width = "100%";
                                document.getElementById("thirdModelDiagram").appendChild(iframe);
                            }
                            
                            iframe.srcdoc = response.generatedText;
                        }
                        else if (outputType == "puml" || outputType == "dot") {

                            consolePanel.setOutput(response.output);
                            var krokiEndpoint = "";
                            if (outputType == "puml") krokiEndpoint = "plantuml";
                            else krokiEndpoint = "graphviz/svg"

                            var krokiXhr = new XMLHttpRequest();
                            krokiXhr.open("POST", "https://kroki.io/" + krokiEndpoint, true);
                            krokiXhr.setRequestHeader("Accept", "image/svg+xml");
                            krokiXhr.setRequestHeader("Content-Type", "text/plain");
                            krokiXhr.onreadystatechange = function () {
                                if (krokiXhr.readyState === 4) {
                                    if (krokiXhr.status === 200) {
                                        outputPanel.renderDiagram(krokiXhr.responseText);
                                    }
                                }
                            };
                            krokiXhr.send(response.generatedText);
                        }
                        else {
                            consolePanel.setOutput(response.output + response.generatedText);
                        }
                    }
                }

            }
            Metro.notify.killAll();
        }
    };
    var data = editorsToJson();
    xhr.send(data);
    longNotification("Executing program");
}

function longNotification(title, cls="light") {
    Metro.notify.create("<b>" + title + "...</b><br>This may take a few seconds to complete if the back end is not warmed up.", null, {keepOpen: true, cls: cls, width: 300});
}

function toggle(elementId, onEmpty) {
    var element = document.getElementById(elementId);
    if (element == null) return;

    if (getComputedStyle(element).display == "none") {
        element.style.display = "flex";
        if (element.innerHTML.length == 0) {
            onEmpty();
        }
    }
    else {
        element.style.display = "none";
    }
    updateGutterVisibility();
}


function updateGutterVisibility() {
    for (const gutter of Array.prototype.slice.call(document.getElementsByClassName("gutter"))) {

        var visibleSiblings = Array.prototype.slice.call(gutter.parentNode.children).filter(
            child => child != gutter && getComputedStyle(child).display != "none");
        
        if (visibleSiblings.length > 1) {
            var nextVisibleSibling = getNextVisibleSibling(gutter);
            var previousVisibleSibling = getPreviousVisibleSibling(gutter);
            if (nextVisibleSibling != null && nextVisibleSibling.className != "gutter" && previousVisibleSibling != null) {
                gutter.style.display = "flex";
            }
            else {
                gutter.style.display = "none";
            }
        }
        else {
            gutter.style.display = "none";
        }
    }
}

function getNextVisibleSibling(element) {
    var sibling = element.nextElementSibling;
    while (sibling != null) {
        if (getComputedStyle(sibling).display != "none") return sibling;
        sibling = sibling.nextElementSibling;
    }
}

function getPreviousVisibleSibling(element) {
    var sibling = element.previousElementSibling;
    while (sibling != null) {
        if (getComputedStyle(sibling).display != "none") return sibling;
        sibling = sibling.previousElementSibling;
    }
}

function showDownloadOptions(event) {
    downloadDialog.show(event);
}

function showSettings(event) {
    settingsDialog.show(event);
}

// Some functions and variables are accessed  
// by onclick - or similer - events
// We need to use window.x = x for this to work
window.fit = fit;
window.updateGutterVisibility = updateGutterVisibility;
window.runProgram = runProgram;

window.programPanel = programPanel;
window.secondProgramPanel = secondProgramPanel;
window.consolePanel = consolePanel;
window.firstModelPanel = firstModelPanel;
window.secondModelPanel = secondModelPanel;
window.thirdModelPanel = thirdModelPanel;
window.firstMetamodelPanel = firstMetamodelPanel;
window.secondMetamodelPanel = secondMetamodelPanel;
window.panels = panels;

window.backend = backend;
window.toggle = toggle;
//window.renderDiagram = renderDiagram;
window.longNotification = longNotification;
window.showDownloadOptions = showDownloadOptions;
window.showSettings = showSettings;
window.copyShortenedLink = copyShortenedLink;
window.downloadDialog = downloadDialog;
window.language = language;
window.getPanelTitle = getPanelTitle;