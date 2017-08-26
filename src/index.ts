#!/usr/bin/env node
import * as program from 'Commander';
import { getAuth, IAuthResponse } from 'node-sp-auth';
import * as request from 'request-promise';
import { IExtention } from './interfaces';
import { ExtensionScope } from './enums';
const Preferences = require('preferences');
const colors = require('colors/safe');

program
  .version('0.1.0')
  .option('-c, --connect <siteurl>', 'Connect to SharePoint Online at <siteurl>', null)
  .option('-w, --web', 'Show extentions at the web level')
  .option('-s, --sitecollection', 'Show extentions at the site collection level')
  .option('-l, --list <listtitle>', 'Show extentions at the list level for <listtitle>')
  .parse(process.argv);

const prefs = new Preferences('vman.sp.extentions.cli', {
  siteUrl: '',
  authHeaders: null
});

if (program.connect) {
  prefs.siteUrl = program.connect;
  getAuth(prefs.siteUrl, {
    ondemand: true,
    electron: require('electron'),
    force: false,
    persist: true
  }).then((authResponse: IAuthResponse) => {

    prefs.authHeaders = authResponse.headers;
    prefs.authHeaders.Accept = 'application/json;odata=nometadata';
  });
}

if (program.web) {
  displayExtentions(ExtensionScope.Web);
}

if (program.sitecollection) {
  displayExtentions(ExtensionScope.SiteCollection);
}

if (program.list) {
  displayListExtentions();
}

async function displayExtentions(scope: ExtensionScope) {
  try {
    ensureAuth();

    const userCustomActionUrl: string = `${prefs.siteUrl}/_api/${scope}/UserCustomActions?$filter=startswith(Location, 'ClientSideExtension')&$select=ClientSideComponentId,Title,Location,ClientSideComponentProperties`;

    const fieldsPath: string = (scope === ExtensionScope.Web) ? 'fields' : 'rootWeb/availablefields';
    const fieldCustomizerUrl: string = `${prefs.siteUrl}/_api/${scope}/${fieldsPath}?$select=ClientSideComponentId,Title,ClientSideComponentProperties`;

    const [exts, fields] = await Promise.all([fetchExtentions(userCustomActionUrl), fetchExtentions(fieldCustomizerUrl)]);

    const siteExtentions: IExtention[] = exts as IExtention[];
    const fieldCustomizers: IExtention[] = getFieldCustomizers(fields as IExtention[]);

    const extentions = siteExtentions.concat(fieldCustomizers);

    console.log(colors.magenta(`'${scope}' level spfx extentions at '${prefs.siteUrl}'`));
    printToConsole(extentions);

  } catch (error) {
    console.log(colors.red(error.message));
  }
}

function printToConsole(extentions: IExtention[]){
  console.log(colors.yellow('Title | ClientSideComponentId | Location | ClientSideComponentProperties'));
  for (const ext of extentions) {
    console.log(colors.green([ext.Title, ext.ClientSideComponentId, ext.Location, ext.ClientSideComponentProperties].join(' | ')));
  }
}

function getFieldCustomizers(fields: IExtention[]){
  return fields
  .filter((field) => field.ClientSideComponentId !== '00000000-0000-0000-0000-000000000000')
  .map((fieldCustomizer) => {
    fieldCustomizer.Location = 'FieldCustomizer';
    return fieldCustomizer;
  });
}

function ensureAuth() {
  if (!prefs.siteUrl) {
    throw new Error('Please use --connect <siteurl> to auth with SPO. Type --help for help.');
  }
}

async function fetchExtentions(restUrl: string) {
  const response: any = await request.get({
    url: restUrl,
    headers: prefs.authHeaders
  });
  return JSON.parse(response).value;
}

async function displayListExtentions() {
  try {
    ensureAuth();
    const restUrl: string = `${prefs.siteUrl}/_api/web/lists/GetByTitle('${program.list}')/fields?$select=Title,ClientSideComponentId,ClientSideComponentProperties`;

    const extentions: IExtention[] = getFieldCustomizers(await fetchExtentions(restUrl) as any[]);

    console.log(colors.magenta(`FieldCustomizer spfx extentions on '${program.list}' at '${prefs.siteUrl}'`));

    printToConsole(extentions);

  } catch (error) {
    console.log(colors.red(error.message));
  }
}