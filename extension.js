// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs')
const helper = require("./helper.js");

function ConstructVariable(name, type) {
	var variablePair = {
		name: name,
		type: type
	}

	return variablePair
}


/**
 * @param {vscode.ExtensionContext} context
 */
// The code you place here will be executed every time your command is executed
//TODO:Add folder name for test.

function activate(context) {
	let disposable = vscode.commands.registerCommand('cpp.gtesttemplate', async function () {

		//initialize
		const editor = vscode.window.activeTextEditor
		let cursorPosition = editor.selection.start

		//getting function block
		let wordRange = editor.document.getWordRangeAtPosition(cursorPosition)
		let functionName = editor.document.getText(wordRange)
		var wordLine = editor.document.lineAt(cursorPosition)
		var textRange = new vscode.Range(wordLine.range.start, wordLine.range.end)
		var wholeText = editor.document.getText(textRange)

		var lineCount = cursorPosition.line

		//for multiline declaration
		while (!wholeText.includes('{')) {
			console.log(lineCount)
			if (lineCount > editor.document.lineCount) {
				vscode.window.showInformationMessage("Invalid method")
				return
			}
			lineCount++
			var wordLine = editor.document.lineAt(lineCount)
			var textRange = new vscode.Range(wordLine.range.start, wordLine.range.end)
			wholeText += editor.document.getText(textRange)
		}

		wholeText = wholeText.substring(0, wholeText.indexOf("{") + 1)
		console.log("Whole text is" + wholeText)

		var beforeRegex = /\((.*?)\)/

		//getting argument list
		var pattern = new RegExp(`[\n\r]*${functionName}*([^\n\r]*)`);
		var result = wholeText.match(pattern)
		var varList = result[1].match(beforeRegex)

		var argsListString = varList[1].trim().split(",")
		console.log("Args list string is" + argsListString)

		var tempType = ''
		var argVarList = []

		for (var i = argsListString.length - 1; i >= 0; --i) {
			argsListString[i] = argsListString[i].trim()
			var nameAndType = argsListString[i].split(" ")

			if (nameAndType.length < 2) {
				argVarList.unshift(ConstructVariable(nameAndType[0], tempType))
			} else {
				argVarList.unshift(ConstructVariable(nameAndType[0], nameAndType[1]))
				tempType = nameAndType[1]
			}
		}

		//getting returning result
		var afterVar = result[1].substring(result[1].indexOf(")"));

		//cleaning
		afterVar = afterVar.replace(/[(){}\s]/g, '')

		//var returnList = afterVar.split(",")
		var argsList = helper.GetArgString(argVarList)
		argsList.replace(/\t+/g, '')

		var currentlyOpenTabfilePath = vscode.window.activeTextEditor.document.fileName
		var generatedTest = `
TYPED_TEST(${helper.GetTestClassName(helper.GetHeaderFileName(currentlyOpenTabfilePath))},Should${functionName})
{
${helper.GetArgString(argVarList)}
${helper.GetAssertString()}
}`

		//var isFirstTime = vscode.workspace.getConfiguration('Location of test file').get('current-directory') 
		//var initialPath = vscode.workspace.getConfiguration('Location.TestFile').get('path')
		var testFile = vscode.workspace.getConfiguration('Location')
		var prop = testFile.get('TestFile')
		//console.log(initialPath)
		if (prop[helper.GetSourceFileName(currentlyOpenTabfilePath)] == undefined) {
			console.log("I am inside")
			var filePath = await GetUserEnteredFilePath()
			var absoluteFilePath
			if (filePath[0]) {
				absoluteFilePath = filePath[0].fsPath + "/"

				prop[helper.GetSourceFileName(currentlyOpenTabfilePath)] = absoluteFilePath
				await testFile.update('TestFile', prop, vscode.ConfigurationTarget.Global).then(() => {
					console.log("Updated");

				})
				prop['useUserDefinedPath'] = "true"
				await testFile.update('TestFile', prop, vscode.ConfigurationTarget.Global).then(() => {
					console.log("Updated");
				})
			}
		}
		else if (prop['useUserDefinedPath'] == "true") {
			console.log("Inside here")
			absoluteFilePath = prop[helper.GetSourceFileName(currentlyOpenTabfilePath)]
		}
		else {
			absoluteFilePath = helper.GetCurrentDirectory(currentlyOpenTabfilePath) + "/";
		}

		absoluteFilePath = absoluteFilePath + helper.GetSourceFileName(currentlyOpenTabfilePath)

		var fileName = absoluteFilePath.replace(".cpp", "") + "Test.cpp"
		console.log("file name is" + fileName)

		WriteToFile(absoluteFilePath, fileName, generatedTest, `Test_${functionName}`)
	});

	context.subscriptions.push(disposable);
}

function WriteToFile(absoluteFilePath, filename, message, testFunctionName) {
	fs.open(filename, 'r', function (err, fd) {
		if (err) {
			fs.writeFile(filename, '', { mode: parseInt('777', 8) }, function (err) {
				if (err) {
					vscode.window.showInformationMessage("File cannot be opened.Check the path.")
				}
				message = helper.GetHeaders(absoluteFilePath) + '\n' + helper.AddNameSpace()+'\n'+ helper.GetClassInitialization(absoluteFilePath) +
					"{" + helper.GetConstructorAndDestructor(absoluteFilePath) + "};" + message + "\n" + "}"
				let writer = fs.createWriteStream(filename, { flags: 'a+', start:0 })
				writer.write(message)
			});
		} else {
			fs.readFile(filename,'utf-8', function (err, data) {
				var charCount = data.length
				if (err) throw err;
				if (data.indexOf(testFunctionName) >= 0) {
					vscode.window.showInformationMessage("Unit test not created")
					return
				}
				message += "\n"+"}"
				let writer = fs.createWriteStream(filename, { flags: 'a+', start:charCount-2})
				writer.write(message)
			});
		}
	});
}

async function GetUserEnteredFilePath() {
	const APP_FILE = await vscode.window.showOpenDialog({
		filters: {

		},
		canSelectFolders: true,
		canSelectFiles: false,
		canSelectMany: false,
		openLabel: 'Select',
	});

	if (!APP_FILE || APP_FILE.length < 1) {
		return;
	}
	console.log(APP_FILE)
	return APP_FILE
}
//exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}



