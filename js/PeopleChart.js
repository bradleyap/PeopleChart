/*
   Copyright 2021 Bradley A. Pliam

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

PeopleChart = {};
PeopleChart.orientation = 'vrt';
PeopleChart.cfg = 'show_children';
PeopleChart.tempStore = {};

PeopleChart.getAppState = function(scopeItem){
  var wnd = SharedGlobal.core.getWindowPaneFromIndex(SharedGlobal.core.getHostPaneIndex());
  var awid = SharedGlobal.core.scopeItem.appInstanceId + '_' + wnd.paneId;
  if(typeof PeopleChart.tempStore[awid] === 'undefined'){
    if(typeof scopeItem === 'undefined'){
      scopeItem = SharedGlobal.core.scopeItem;
    }
    ts = PeopleChart.tempStore[awid] = {};
    ts.awid = awid;
  }
  return PeopleChart.tempStore[awid];
}

function initializeForPeopleChart(core,responseCallback){
  var apIdx = core.getHostPaneIndex();
  var props = {};
  if(typeof core.scopeItem.appdat === 'undefined'){
    props = core.scopeItem.appdat = {};
  }
  if(typeof props.intent === 'undefined'){
    props.intent = 'geneology';
  }
  //change set 258
  //if(props.intent === 'org_chart'){
//  if(props.intent === 'org chart'){
    //core.setupResponsiveMenuitem(apIdx,'author','add_coworker','outofbounds,navpath,container,child,resource','','','',PeopleChart.doAddCoworker);
    //core.setupResponsiveMenuitem(apIdx,'author','add_direct report','outofbounds,navpath,container,child,resource','','','',PeopleChart.doAddDirectReport);
  core.setupResponsiveMenuitem(apIdx,'author','add_coworker','outofbounds,navpath,container,child,resource','','','',function(e){PeopleChart.doAddPerson('coworker');});
  core.setupResponsiveMenuitem(apIdx,'author','add_direct report','outofbounds,navpath,container,child,resource','','','',function(e){PeopleChart.doAddPerson('direct report');});
//  }
//  if(props.intent === 'geneology'){
  core.setupResponsiveMenuitem(apIdx,'author','add_spouse','outofbounds,navpath,container,child,resource','','','',function(e){PeopleChart.doAddPerson('spouse')});
  core.setupResponsiveMenuitem(apIdx,'author','add_sibling','outofbounds,navpath,container,child,resource','','','',function(e){PeopleChart.doAddPerson('sibling')});
  core.setupResponsiveMenuitem(apIdx,'author','add_child','outofbounds,navpath,container,child,resource','','','',function(e){PeopleChart.doAddPerson('child')});
//  }
  //change set 258
  core.setupResponsiveMenuitem(apIdx,'author','specify_chart type','outofbounds,navpath,container,child,resource','','','',PeopleChart.doSpecifyChartType);

  core.setupResponsiveMenuitem(apIdx,'author','edit','child','','','',PeopleChart.handleEditPeopleChart);
  core.setupResponsiveMenuitem(apIdx,'author','remove','child','','','',function(e){core.removeItem(e);});

  PeopleChart.updateMenuitemsForNewType(props.intent);

  var wnd = core.getWindowPaneFromIndex(core.getHostPaneIndex());
  core.setMaxWindowSize(wnd,2400,-1);
}

function generatePeopleChartHTML(core,responseCallback){
  PeopleChart.cnItemDex = -1;
  var iter = core['tracker'];
  iter.setRecursionDepthLimit(150);
  var as = PeopleChart.getAppState();
  as.inset = 10;
  as.minSpacing = 8;
  as.flowlineWd = 20;
  as.treeDepth = 0;
  as.bundleMap = {"":{domId:"",node:iter.scopeItem,pr:""}};
  as.maxSzChildArr = 0;
  as.centeringMgn = {left:0,right:0,top:0,bottom:0};
  as.devmode = true; 
  /*if(as.devmode){
    as.vbarArr = [];
    as.barPos = 0;
  }
  */
  var html = '';
  if(typeof SharedGlobal.core.scopeItem.cdrn !== 'undefined'){
    html += '<div id="expandingBkgd">';
    /*if(as.devmode){
      html += '<div id="contentRgn1"></div>';
      html += '<div id="contentRgn2"></div>';
    }*/
    html += PeopleChart.getPrelimHTML(core,as,iter,'');
    /*if(as.devmode){
      html += '<div id="ruler2"></div>';
    }*/
    html += '</div>';
  }
  if(html === ''){
    html += '<div class="basic-child-item">[empty]</div>';
  }
  var retData = {};
  var appletValues = {};
  appletValues['isMultiLevel'] = true;
  appletValues['explicitChildCount'] = SharedGlobal.tic.getNonResIdCount();
  appletValues['explicitResourceCount'] = 0;
  appletValues['postHTMLInstallAppletInfo'] = {"method":PeopleChart.postHTMLInstall,"data":{}};
  retData['appletValuesMap'] = appletValues;
  responseCallback(retData);
  return html;
}

PeopleChart.getPrelimHTML = function(core,as,iter,pr){ //pr = path route, dot (.) -separated xpath string 
  var html = '';
  var curIdString = '';
  var len = iter.childItemCount();
  var sep = '';
  if(pr !== ""){
    sep = '.';
  }
  if(iter.levelDepth > as.treeDepth){
    as.treeDepth = iter.levelDepth;
  }
  if(len > as.maxSzChildArr){
    as.maxSzChildArr = len;
  }
  var haveContentPanel = false;
  var haveBradContentPanel = false;
  if(len > 0){
    html += '<svg xmlns="http://www.w3.org/2000/svg" class="flowline" id="fl-' + pr + '"><path class="fl-path" stroke="#7669a6" fill="none" stroke-width="2"  d="M 7, 7 v 3"></path></svg>';
  }
  for(var i=0; i<len; i++){
    var n = iter.child();
    if(n){
      curIdString = iter.getIdString();
      SharedGlobal.tic.push(curIdString); 
      var childPr = pr + sep + Number(i).toString();
      var bundleId = childPr;
      if(typeof as.bundleMap[bundleId] === 'undefined'){
        as.bundleMap[bundleId] = {domId:curIdString,node:n,pr:childPr};
      }
      var ttl = n.ttl;
      if(typeof n.ttl === 'undefined'){
        ttl = 'unnamed';
      }
      if(typeof n.appdat === 'undefined'){
        continue;
      }
      if(typeof n.appdat.isSpouse === 'string'){
        
      }
      html += '<div class="personInfo" id="' + curIdString + '">' + ttl + '</div> ';
      html += PeopleChart.getPrelimHTML(core,as,iter.down(),childPr);
      //SharedGlobal.tic.push(curIdString); 
    }
    iter.next();
  }
  return html;
}

PeopleChart.postHTMLInstall = function(){
  var fontSz = 18;
  var bgElmt = document.getElementById('expandingBkgd');
  var as = PeopleChart.getAppState();
  var keys = Object.keys(as.bundleMap);
  if(keys.length > 20){
    fontSz = 14;
  }
  if(keys.length > 100){
    fontSz = 10;
  }
  for(var i=0; i<keys.length; i++){
    var bundleId = keys[i];
    var bundle = as.bundleMap[bundleId];
    var elmt = document.getElementById(bundle.domId);
    bundle.domElmt = elmt;
    if(elmt){
      elmt.style.fontSize = fontSz + 'px';
    }
  }
  var contentSz = PeopleChart.calculateChildBoxSizes('',as);
/*  if(as.devmode){
    var devElmt = document.getElementById('contentRgn1');
    devElmt.style.width = contentSz.w + 'px';
    devElmt.style.height = contentSz.h + 'px';
  }
*/
  var sz = SharedGlobal.core.getHostPane().getContentAreaSize(); 
  var leftMgn = (sz.width - contentSz.w) / 2;
  var topMgn = (sz.height - contentSz.h) / 2;
  if(leftMgn < 20)leftMgn = 20;
  if(topMgn < 20)topMgn = 20;
  bgElmt.style.height = (topMgn * 2) + contentSz.h + 'px'; //sz.height + 'px';
  PeopleChart.setOrigins('',as,{left:leftMgn,top:topMgn});
}

PeopleChart.calculateChildBoxSizes = function(pr,as){
  var parentBundle = as.bundleMap[pr];
  var sep = '';
  if(pr !== ''){
    sep = '.';
  }
  var spcr = 0;
  var flElmt = parentBundle.flowlineElmt = document.getElementById('fl-' + pr);
  var hrzStackSz = {w:as.inset,h:0};
  var vrtStackSz = {w:as.inset,h:0};
  for(var i=0; i<as.maxSzChildArr; i++){
    var bundle = as.bundleMap[pr + sep + Number(i).toString()];
    if(typeof bundle === 'undefined'){
      break;
    }
    var size = PeopleChart.calculateChildBoxSizes(pr + sep + Number(i).toString(),as);
    if(size.w > vrtStackSz.w){
      vrtStackSz.w = size.w;
    }
    if(size.h > hrzStackSz.h){
      hrzStackSz.h = size.h;
    }
    vrtStackSz.h += as.minSpacing + size.h;
    hrzStackSz.w += as.minSpacing + size.w;
    spcr = as.minSpacing;
  }
  var box = {width:0,height:0};
  if(typeof parentBundle !== 'undefined'){
    if(typeof parentBundle.domElmt !== 'undefined' && parentBundle.domElmt){
      box = parentBundle.domElmt.getBoundingClientRect();
    }
  }
  parentBundle.childOffset = {width:as.inset,height:box.height};
  parentBundle.flOffset = {width:as.inset,height:box.height};
  hrzStackSz.h += box.height;
  vrtStackSz.h += box.height;

  var hrzInnerNodePxlBumpWithVrtStack = 0;
  var hrzInnerNodePxlBumpWithHrzStack = 0;
  if(flElmt){
    hrzInnerNodePxlBumpWithVrtStack = as.inset + as.flowlineWd;
    hrzInnerNodePxlBumpWithHrzStack = as.inset;
  }
  if(box.width > (vrtStackSz.w + as.inset)){
    vrtStackSz.w = box.width + hrzInnerNodePxlBumpWithVrtStack;
  }
  else{
    vrtStackSz.w += hrzInnerNodePxlBumpWithVrtStack;
  }
  if(box.width > (hrzStackSz.w + as.inset)){
    hrzStackSz.w = box.width + hrzInnerNodePxlBumpWithVrtStack;
  }
  else{
    hrzStackSz.w += hrzInnerNodePxlBumpWithVrtStack;
  } 

  parentBundle.stackDir = 'hrz';
  parentBundle.size = hrzStackSz;
  var lg = vrtStackSz.w;
  if(vrtStackSz.h > lg){
    lg = vrtStackSz.h;
  }
  if(hrzStackSz.h > lg || hrzStackSz.w > lg){
    parentBundle.stackDir = 'vrt';
    parentBundle.size = vrtStackSz;
    if(flElmt){
      flElmt.style.width = as.flowlineWd + 'px';
      flElmt.style.height = (vrtStackSz.h - box.height) +  'px';
    }
    return vrtStackSz;
  }
  if(flElmt){
    flElmt.style.width = (hrzStackSz.w - box.width) + 'px';
    flElmt.style.height = as.flowlineWd + 'px';
  }
  return hrzStackSz;
}

PeopleChart.setOrigins = function(parentPr,as,origin){
  var sep = '';
  if(parentPr !== ''){
    sep = '.';
  }
  var pt = {left:origin.left,top:origin.top};
  var parentBundle = as.bundleMap[parentPr];
  var flElmt = parentBundle.flowlineElmt;
  var flPt = {left:0,top:0};
  var pathElmt = null;
  var orthogonalToArr = [];
  if(flElmt){
    parentBundle.flowlineElmt.style.top = (pt.top + parentBundle.flOffset.height) + 'px';
    parentBundle.flowlineElmt.style.left = (pt.left + parentBundle.flOffset.width) + 'px';
    pathElmt = flElmt.querySelector('.fl-path');
  }
  pt.left += parentBundle.childOffset.width;
  pt.top += parentBundle.childOffset.height;
  var sDir = parentBundle.stackDir;
  if(sDir === 'vrt'){
    pt.left += as.flowlineWd;
    pt.top += as.minSpacing;
  }
  else{
    pt.left += as.minSpacing;
    pt.top += as.flowlineWd;
  }
  for(var i=0; i<as.maxSzChildArr; i++){
    var pr = parentPr + sep + Number(i).toString();
    var bundle = as.bundleMap[pr];
    if(typeof bundle === 'undefined'){
      break;
    }
    bundle.domElmt.style.left = Number(pt.left).toString() + 'px';
    bundle.domElmt.style.top = Number(pt.top).toString() + 'px';

    orthogonalToArr.push({x:flPt.left,y:flPt.top});
    PeopleChart.setOrigins(pr,as,{left:pt.left,top:pt.top}); 
 
    if(sDir === 'hrz'){
      flPt.left += bundle.size.w + as.minSpacing;
      pt.left += bundle.size.w + as.minSpacing;
    }
    else{
      flPt.top += bundle.size.h + as.minSpacing;
      pt.top += bundle.size.h + as.minSpacing;
    }
  }
  if(parentBundle.flowlineElmt){ // && parentPr === '0.0'){
    var fls = ''; //fls = flowline string
    var halfWd = as.flowlineWd / 2;
    var vStemAdj = 10;
    var hStemAdj = 15;
    var p0 = {x:0,y:0};
    var lCmd = '';
    if(pathElmt){
      for(var i=0; i<=orthogonalToArr.length; i++){
        if(i != orthogonalToArr.length){
          p1 = orthogonalToArr[i];
          lCmd = '';
          if(i == 0){
            //this part of the flowline stem is missing because of the stem adjustments, it is added here just on initial iteration
            if(sDir === 'vrt'){
              lCmd = 'M ' + halfWd + ' ' + vStemAdj + ' V 0 ';
            }
            else{
              //magic number 5 is how far to move the stem to the right factoring for the horizontal stem adjustment 
              lCmd = 'M ' + ' 5 ' + ' 0 ' + PeopleChart.getSvgCurveStemForVerticalFlowline(5,0,5 + halfWd,halfWd) + ' ';
            }
          }
          if(sDir === 'vrt'){
            lCmd += 'M ' + (p1.x + halfWd) + ' ' + (p1.y + vStemAdj) + ' V ' + (p0.y + vStemAdj) + ' ';
          }
          else{
            lCmd += 'M ' + (p1.x + hStemAdj) + ' ' + (p1.y + halfWd) + ' H ' + (p0.x + hStemAdj) +  ' ';
          }
        }
        else{
          p1 = null;
          if(sDir === 'vrt'){
            lCmd = 'M ' + (p0.x + halfWd) + ' ' + (p0.y + vStemAdj) + ' '; 
          }
          else{
            lCmd = 'M ' + (p0.x + hStemAdj) + ' ' + (p0.y + halfWd) + ' ';
          }
        }
        if(sDir === 'vrt'){
          fls += lCmd + PeopleChart.getSvgCurveStemForVerticalFlowline(p0.x + halfWd,p0.y + vStemAdj,p0.x + as.flowlineWd,p0.y + halfWd + vStemAdj) + ' ';
        }
        else{
          fls += lCmd + PeopleChart.getSvgCurveStemForHorizontalFlowline(p0.x + hStemAdj,p0.y + halfWd,p0.x + halfWd + hStemAdj,p0.y + as.flowlineWd) + ' ';
        }
        if(p1){
          p0.x = p1.x;
          p0.y = p1.y;
        }
      }
      pathElmt.setAttribute('d',fls);
    }
  }
}

PeopleChart.getSvgCurveStemForHorizontalFlowline = function(x1,y1,x2,y2){
  return 'C ' + Number(x1 + 8).toString() + ' ' + Number(y1).toString() + ' ' + Number(x2).toString() + ' ' + Number(y2 - 3).toString() + ' ' + Number(x2).toString() + ' ' + Number(y2).toString();  
}

PeopleChart.getSvgCurveStemForVerticalFlowline = function(x1,y1,x2,y2){
  return 'C ' + Number(x1).toString() + ' ' + Number(y1 + 8).toString() + ' ' + Number(x2 - 3).toString() + ' ' + Number(y2).toString() + ' ' + Number(x2).toString() + ' ' + Number(y2).toString();  
}

function handlePeopleChartKeyDown(e,core,responseCallback){
  var handled = false;
  var keycode = SharedGlobal.core['getKeycodeFromEvent'](e);
  if(keycode === 'KeyR' || keycode === 'r'){
    //PeopleChart.addTblRow(e);
    handled = true;
  }
  if(keycode === 'KeyD' || keycode === 'd'){
   //PeopleChart.addTblCell(e);
   handled = true;
  }
  if(keycode === 'KeyE' || keycode === 'e'){
    //handled = PeopleChart.handleSimpleEditOnTbl(e,core,responseCallback);
  }
  return handled;
}

PeopleChart.doAddCoworker = function(e){

}

PeopleChart.doAddDirectReport = function(e){

}

PeopleChart.doAddPerson = function(relationship){
  var customDlgInfo = {"fields":[
    {type:"bold_text",text:"Person info"},
    {type:"std_edit",label:"Name",box_class:"long",value:"0",key:"nam"},
    {type:"std_edit",label:"Gender",box_class:"short",value:"unknown",key:"sex"},
    {type:"multi_edit_line",label:"Date born",box_class:"short",box_class_array:['micro','micro','short'],value:"1|2|2020",fmt_delim:"|",format:"month:|day:|year:|",key:"bdt"},
    {type:"multi_edit_line",label:"Date died",box_class:"short",box_class_array:['micro','micro','short'],value:"1|2|2020",fmt_delim:"|",format:"month:|day:|year:|",key:"ddt"},
    {type:"std_edit",label:"Details",box_class:"long",value:"0",key:"det"}
  ]};
  var as = PeopleChart.getAppState(SharedGlobal.core.scopeItem);
  as.addRequest = relationship;
  SharedGlobal.core.displayCustomPopup(customDlgInfo,PeopleChart.acceptPersonInfo);
}

PeopleChart.acceptPersonInfo = function(info){
  var as = PeopleChart.getAppState(SharedGlobal.core.scopeItem);
  var core = SharedGlobal.core;
  var si = core.getSelectionInfo();
  var ci = -1;
  if(si.rgn === 'child'){
    ci = si.zoneIndex;  
  }
  var nuItem = core.createNewVaultItem();
  nuItem.ttl = info.nam.value;
  nuItem.appdat = {dob:info.bdt.value,sex:info.sex.value,dod:info.ddt.value,details:info.det.value};
  if(as.relationship === 'spouse'){
    nuItem.appdat.isSpouse = true;
  }
  var parentId = si.scopeIndex;
  var parentId = -1;
  var childIdx = -1;
  var childIds = SharedGlobal.core.getChildIds();
  if(si.pane.tabIdsPos > -1 && ci > -1){
    var encodedIdArr = si.pane.tabIdsArr[si.pane.tabIdsPos].split('_');
    //change set 258
    if(as.addRequest === 'child' || as.addRequest === 'spouse' || as.addRequest === 'direct report'){
      parentId = childIds[encodedIdArr[1]][encodedIdArr[2]];
    }
    if(as.addRequest === 'sibling' || as.addRequest === 'coworker'){
      parentId = encodedIdArr[1];
      childIdx = encodedIdArr[2];
    }
  }
  else{
    parentId = core.scopeItemIndex;
  }
  core.addVaultItem(parentId,'',nuItem,childIdx);
  core.requestRedraw(true);
}

PeopleChart.doAddChildObject = function(e){
  EntityManager.createEntityWizard('person');  
}

PeopleChart.handleEditPeopleChart = function(e){
  var customDlgInfo = {"fields":[
{type:"bold_text",text:"Format selected text"},
{type:"edit",label:"font size: ",box_class:"short",value:"",key:"fs"},
{type:"edit",label:"font family:",box_class:"long",value:"",key:"ff"},
{type:"edit",label:"color:",box_class:"medium",value:"",key:"clr"},
{type:"edit",label:"background color:",box_class:"medium",value:"",key:"bgc"},
{type:"edit",label:"border color:",box_class:"medium",value:"",key:"bc"},
{type:"edit",label:"border width:",box_class:"medium",value:"",key:"bw"},
{type:"edit",label:"border style:",box_class:"medium",value:"",key:"bs"},
{type:"edit",label:"text decoration: ",box_class:"short",value:"0",key:"td"},
{type:"checkbox",label:"all caps",value:false,key:"ac"},
{type:"checkbox",label:"italicized",value:false,key:"ital"},
{type:"checkbox",label:"center horizontally",value:false,key:"ctr"},
{type:"edit",label:"padding above: ",box_class:"short",value:"0",key:"pa"},
{type:"edit",label:"padding below: ",box_class:"short",value:"0",key:"pb"},
{type:"edit",label:"left indents: ",box_class:"short",value:"0",key:"li"}
]};
  for(var i=1; i<15; i++){
    customDlgInfo.fields[i].value = fmtVals[i - 1];  
  }
  SharedGlobal.core['displayCustomPopup'](customDlgInfo,PeopleChart.acceptCustomDlgPersonValues);

}

PeopleChart.acceptCustomDlgPersonValues = function(info){

}

//change set 258
PeopleChart.doSpecifyChartType = function(e){
  var customDlgInfo = {"fields":[
    {type:"bold_text",text:"People chart type"},
    {type:"normal_text",text:"Select type"},
    {type:"radio",options:['geneology','org chart'],key:'ct'}
  ]};
  var as = PeopleChart.getAppState(SharedGlobal.core.scopeItem);
  SharedGlobal.core.displayCustomPopup(customDlgInfo,PeopleChart.acceptChartTypeUpdate);
}  

//change set 258
PeopleChart.acceptChartTypeUpdate = function(info){
  var type = info['ct'].value;
  var props = SharedGlobal.core.scopeItem.appdat;
  if(props.intent !== type){
    props.intent = type;
    PeopleChart.updateMenuitemsForNewType(type);
  }
}

//change set 258
PeopleChart.updateMenuitemsForNewType = function(type){
  var showGen = false;
  var showOrg = false;
  if(type === 'geneology'){
    showGen = true;
  }
  if(type === 'org chart'){
    showOrg = true;
  }
  var lst = [];
  lst[0] = {"group":"author","commandSequence":"add_coworker","visible":showOrg};
  lst[1] = {"group":"author","commandSequence":"add_direct report","visible":showOrg};
  lst[2] = {"group":"author","commandSequence":"add_spouse","visible":showGen};
  lst[3] = {"group":"author","commandSequence":"add_sibling","visible":showGen};
  lst[4] = {"group":"author","commandSequence":"add_child","visible":showGen};
  SharedGlobal.core.setMenuitemVisibilityFromList(SharedGlobal.core.getHostPaneIndex(),lst);
}




