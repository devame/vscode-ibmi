const vscode = require(`vscode`);

const {CustomUI, Field} = require(`../../api/CustomUI`);

const Configuration = require(`../../api/Configuration`);
let instance = require(`../../Instance`);

module.exports = class SettingsUI {

  /**
   * Called to log in to an IBM i
   * @param {vscode.ExtensionContext} context
   */
  static init(context) {

    context.subscriptions.push(
      vscode.commands.registerCommand(`code-for-ibmi.showAdditionalSettings`, async (server) => {
        const connectionSettings = Configuration.get(`connectionSettings`);
        const connection = instance.getConnection();

        let name;
        let existingConfigIndex;
        let config;

        if (server) {
          name = server.name;
          existingConfigIndex = connectionSettings.findIndex(connection => connection.name === name);

          if (existingConfigIndex >= 0) {
            config = connectionSettings[existingConfigIndex];
          } else {
            vscode.window.showErrorMessage(`Connection ${name} not found`);
            return;
          }

        } else {
          if (connection) {
            config = await instance.getConfig();
            name = config.name;
          } else {
            vscode.window.showErrorMessage(`No connection is active.`);
            return;
          }
        }

        const restartFields = [`enableSourceDates`, `sourceDateLocation`, `clContentAssistEnabled`];
        let restart = false;

        let ui = new CustomUI();
        let field;
    
        field = new Field(`input`, `tempLibrary`, `Temporary library`);
        field.default = config.tempLibrary;
        field.description = `Temporary library. Cannot be QTEMP.`;
        ui.addField(field);
    
        field = new Field(`checkbox`, `autoClearTempData`, `Clear temporary data on startup`);
        field.default = (config.autoClearTempData ? `checked` : ``)
        field.description = `Automatically clear temporary data in the chosen temporary library on startup. Deletes all <code>*FILE</code> objects that start with <code>O</code> in the chosen temporary library.`;
        ui.addField(field);

        field = new Field(`select`, `sqlExecutor`, `SQL executor`);
        field.description = `Which method should be used to execute SQL statements.`;
        field.items = [
          {
            selected: config.sqlExecutor === `default`,
            value: `default`,
            description: `Default`,
            text: `Will use whichever method is available.`,
          },
          {
            selected: config.sqlExecutor === `db2util`,
            value: `db2util`,
            description: `db2util (PASE)`,
            text: `db2util can be installed through yum`,
          },
          {
            selected: config.sqlExecutor === `db2`,
            value: `db2`,
            description: `db2 (QSH)`,
            text: `db2 is shipped with most versions of IBM i`,
          },
          {
            selected: config.sqlExecutor === `QZDFMDB2`,
            value: `QZDFMDB2`,
            description: `QZDFMDB2 (QSYS)`,
            text: `A program to run statements shipped with the OS. Works similarly to db2 (QSH)`,
          },
          {
            selected: config.sqlExecutor === `none`,
            value: `none`,
            description: `None`,
            text: `Uses import files where available`,
          }
        ];
        ui.addField(field);
    
        field = new Field(`input`, `sourceASP`, `Source ASP`);
        field.default = config.sourceASP;
        field.description = `If source files live within a specific ASP, please specify it here. Leave blank otherwise. You can ignore this if you have access to <code>QSYS2.ASP_INFO</code> and have db2util installed, as Code for IBM i will fetch ASP information automatically.`;
        ui.addField(field);
    
        field = new Field(`input`, `sourceFileCCSID`, `Source file CCSID`);
        field.default = config.sourceFileCCSID;
        field.description = `The CCSID of source files on your system. You should only change this setting from <code>*FILE</code> if you have a source file that is 65535 - otherwise use <code>*FILE</code>. Note that this config is used to fetch all members. If you have any source files using 65535, you have bigger problems.`;
        ui.addField(field);
    
        field = new Field(`checkbox`, `autoConvertIFSccsid`, `Support EBCDIC streamfiles`);
        field.default = (config.autoConvertIFSccsid ? `checked` : ``)
        field.description = `Enable converting EBCDIC to UTF-8 when opening streamfiles. When disabled, assumes all streamfiles are in UTF8. When enabled, will open streamfiles regardless of encoding. May slow down open and save operations.<br><br>You can find supported CCSIDs with <code>/usr/bin/iconv -l</code>`;
        ui.addField(field);
    
        field = new Field(`input`, `hideCompileErrors`, `Errors to ignore`);
        field.default = config.hideCompileErrors.join(`, `);
        field.description = `A comma delimited list of errors to be hidden from the result of an Action in the EVFEVENT file. Useful for codes like <code>RNF5409</code>.`;
        ui.addField(field);
    
        field = new Field(`checkbox`, `autoSaveBeforeAction`, `Auto Save for Actions`);
        field.default = (config.autoSaveBeforeAction ? `checked` : ``);
        field.description = `When current editor has unsaved changes, automatically save it before running an action.`;
        ui.addField(field);

        ui.addField(new Field(`hr`));
    
        field = new Field(`checkbox`, `enableSourceDates`, `Enable Source Dates`);
        field.default = (config.enableSourceDates ? `checked` : ``);
        field.description = `When enabled, source dates will be retained and updated when editing source members. Requires restart when changed.`;
        ui.addField(field);

        field = new Field(`select`, `sourceDateLocation`, `Source Date Location`);
        field.description = `The location of the source date of the current line will be displayed.`;
        field.items = [
          {
            selected: config.sourceDateLocation === `none`,
            value: `none`,
            description: `Hidden`,
            text: `Source date is not shown.`,
          },
          {
            selected: config.sourceDateLocation === `inline`,
            value: `inline`,
            description: `Inline`,
            text: `Source date is show on same line being edited.`,
          },
          {
            selected: config.sourceDateLocation === `bar`,
            value: `bar`,
            description: `Bar`,
            text: `Source date is shown on the VS Code status bar.`,
          }
        ];
        ui.addField(field);

        ui.addField(new Field(`hr`));
    
        field = new Field(`checkbox`, `clContentAssistEnabled`, `Enable CL Content Assist`);
        field.default = (config.clContentAssistEnabled ? `checked` : ``);
        field.description = `Enable CL content assist and hover support. After enabled and restarted, Code for IBM i will ask you to install the required tools for the feature to work. This will install programs into your temporary library.`;
        ui.addField(field);

        ui.addField(new Field(`hr`));

        const encodings = [`37`, `256`, `273`, `277`, `278`, `280`, `284`, `285`, `297`, `500`, `871`, `870`, `905`, `880`, `420`, `875`, `424`, `1026`, `290`, `win37`, `win256`, `win273`, `win277`, `win278`, `win280`, `win284`, `win285`, `win297`, `win500`, `win871`, `win870`, `win905`, `win880`, `win420`, `win875`, `win424`, `win1026`];
        
        field = new Field(`select`, `encodingFor5250`, `5250 encoding`);
        field.description = `The encoding for the 5250 emulator.`;
        field.items = encodings.map(encoding => {
          return {
            selected: config.encodingFor5250 === encoding,
            value: encoding,
            description: encoding,
            text: encoding,
          };
        });
        field.items.push({
          selected: config.encodingFor5250 === `default`,
          value: `default`,
          description: `Default`,
          text: `Default`,
        });
        ui.addField(field);

        const terminalTypes = [
          { key: `IBM-3179-2`, text: `IBM-3179-2 (24x80 monochrome)` },
          { key: `IBM-3180-2`, text: `IBM-3180-2 (27x132 monochrome)` },
          { key: `IBM-3196-A1`, text: `IBM-3196-A1 (24x80 monochrome)` },
          { key: `IBM-3477-FC`, text: `IBM-3477-FC (27x132 color)` },
          { key: `IBM-3477-FG`, text: `IBM-3477-FG (27x132 monochrome)` },
          { key: `IBM-5251-11`, text: `IBM-5251-11 (24x80 monochrome)` },
          { key: `IBM-5291-1`, text: `IBM-5291-1 (24x80 monochrome)` },
          { key: `IBM-5292-2`, text: `IBM-5292-2 (24x80 color)` },
        ];

        field = new Field(`select`, `terminalFor5250`, `5250 Terminal Type`);
        field.description = `The terminal type for the 5250 emulator.`;
        field.items = [
          {
            selected: config.terminalFor5250 === `default`,
            value: `default`,
            description: `Default`,
            text: `Default`,
          },
          ...terminalTypes.map(terminal => {
            return {
              selected: config.terminalFor5250 === terminal.key,
              value: terminal.key,
              description: terminal.key,
              text: terminal.text,
            };
          })
        ]
        ui.addField(field);
    
        field = new Field(`checkbox`, `setDeviceNameFor5250`, `Set Device Name for 5250`);
        field.default = (config.setDeviceNameFor5250 ? `checked` : ``);
        field.description = `When enabled, the user will be able to enter a device name before the terminal starts.`;
        ui.addField(field);

        ui.addField(new Field(`hr`));
    
        field = new Field(`submit`, `save`, `Save settings`);
        ui.addField(field);
    
        let {panel, data} = await ui.loadPage(`Settings: ${name}`);
    
        if (data) {
          panel.dispose();

          for (const key in data) {
    
            //In case we need to play with the data
            switch (key) {
            case `sourceASP`:
              if (data[key].trim() === ``) data[key] = null;
              break;
            case `hideCompileErrors`:
              data[key] = data[key].split(`,`).map(item => item.trim().toUpperCase()).filter(item => item !== ``);
              break;
            }
          }

          if (server) {
            if (existingConfigIndex >= 0) {
              config = {
                ...config,
                ...data,
              };

              connectionSettings[existingConfigIndex] = config;
              await Configuration.setGlobal(`connectionSettings`, connectionSettings);
            }
          } else {
            if (connection) {
              if (restartFields.some(item => data[item] !== config[item])) {
                restart = true;
              }
              
              await config.setMany(data);
            }
          }

          if (restart) {
            vscode.window.showInformationMessage(`Some settings require a restart to take effect. Reload workspace now?`, `Reload`, `No`)
              .then(async (value) => {
                if (value === `Reload`) {
                  await vscode.commands.executeCommand(`workbench.action.reloadWindow`);
                }
              });
          }
        }
      }),

      vscode.commands.registerCommand(`code-for-ibmi.showLoginSettings`, async (server) => {
        if (server) {
          const connections = Configuration.get(`connections`);
          const name = server.name;

          const connectionIdx = connections.findIndex(item => item.name === name);
          let connection = connections[connectionIdx];

          let ui = new CustomUI();
          let field;

          field = new Field(`input`, `host`, `Host or IP Address`);
          field.default = connection.host;
          ui.addField(field);

          field = new Field(`input`, `port`, `Port`);
          field.default = connection.port;
          ui.addField(field);

          field = new Field(`input`, `username`, `Username`);
          field.default = connection.username;
          ui.addField(field);

          field = new Field(`paragraph`, `authText`, `Only provide either the password or a private key - not both.`);
          ui.addField(field);

          field = new Field(`password`, `password`, `Password`);
          field.description = `Only provide a password if you want to update an existing one or set a new one.`
          ui.addField(field);

          field = new Field(`file`, `privateKey`, `Private Key`);
          field.description = `Only provide a private key if you want to update from the existing one or set one.`
          field.default = connection.privateKey;
          ui.addField(field);

          ui.addField(new Field(`submit`, `submitButton`, `Save`));

          const {panel, data} = await ui.loadPage(`Login Settings: ${name}`);

          if (data) {
            panel.dispose();
      
            data.port = Number(data.port);
            if (data.privateKey === ``) data.privateKey = connection.privateKey;

            if(data.password && !data.privateKey) {
              context.secrets.delete(`${name}_password`);
              context.secrets.store(`${name}_password`, `${data.password}`)
            };

            delete data.password;

            connection = {
              ...connection,
              ...data
            };

            connections[connectionIdx] = connection;
            await Configuration.setGlobal(`connections`, connections);
          }
        }
      })
    )


  }

}