// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs')
const helper = require("./helper.js");
const { text } = require('stream/consumers');

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
		await executeGtestTemplateCommand()
		//initialize

	});

	let disposable2 = vscode.commands.registerCommand('cpp.mocktemplate', async function () {
		await executeMockTemplateCommand()
	})

	context.subscriptions.push(disposable);
}

async function executeMockTemplateCommand() {
	const editor = vscode.window.activeTextEditor
	let cursorPosition = editor.selection.start

	var currentlyOpenFilePath = vscode.window.activeTextEditor.document.fileName
	var extension = currentlyOpenFilePath.substring(currentlyOpenFilePath.lastIndexOf("."))
	if (extension != ".h") {
		vscode.window.showInformationMessage("Select the header file of the class or interface to create mock")
		return
	}

	var wordRange = editor.document.getWordRangeAtPosition(cursorPosition)
	var IclassName = editor.document.getText(wordRange)
	var wordLine = editor.document.lineAt(cursorPosition)
	var textRange = new vscode.Range(wordLine.range.start, wordLine.range.end)
	var wholeText = editor.document.getText(textRange)
	if (wholeText == "") {
		vscode.window.showInformationMessage("Select the class or interface to create mock")
	}
	//var lineCount = cursorPosition.line

	var isInterface = false
	if (wholeText.includes("__interface")) {
		isInterface = true
	}
	var className=""
	var secondLetter = IclassName.charAt(1)
	if (isInterface && IclassName.startsWith("I") && secondLetter == secondLetter.toUpperCase()) {
		className = IclassName.substring(1)
	}
	else {
		className = IclassName
	}

	var data = fs.readFileSync(currentlyOpenFilePath, 'utf-8');
	var lines = data.split("\n");
	var i = 0
	while (!(lines[i].includes(wholeText))) {
		i++;
	}
	i += 1;
	var l = lines[i].replace("\r\n", "").replace("\r", "").replace("\n", "")
	if (l.length == 1 && l == "{") {
		i += 1
	}

	var generatedMock = "\n"
	generatedMock = generatedMock + "class" + " " + className + "Mock" + ": " + "public" + " " + IclassName + "\n"
	generatedMock += "{\n"
	generatedMock += "public:\n"
	for (var j = i; j < lines.length; j++) {
		if (lines[j].includes("};")) {
			generatedMock += "};\n\n"
			break;
		}
		if (isInterface || lines[j].includes("virtual")) {
			if (lines[j].includes("(") && !(lines[j].includes(")"))) {
				j += 1;
				while (!(lines[j].includes(")"))) {
					j++;
				}
			}
			else if (lines[j].includes("(") && lines[j].includes(")")) {
				lines[j].replace("virtual", "");
				var ReturnTypeAndMethodName = lines[j].substring(0, lines[j].indexOf('('));
				ReturnTypeAndMethodName = ReturnTypeAndMethodName.trim();
				var Args = lines[j].substring(lines[j].indexOf('('), (lines[j].indexOf(")") + 1));
				var ReturnTypeAndMethodNameSplit = ReturnTypeAndMethodName.split(' ');
				generatedMock += "MOCK_METHOD" + "(" + ReturnTypeAndMethodNameSplit[0] + "," + ReturnTypeAndMethodNameSplit[1] + "," + Args + "," + "(override)" + ")" + ";";
				generatedMock += ("\n");
			}
		}

	}
	var shouldSelectFolder = false;
	var filePath = await GetUserEnteredFilePath(shouldSelectFolder, "Source files | *.cpp")
	var fileName
	if (filePath[0]) {
		fileName = filePath[0].fsPath
		var data = fs.readFileSync(fileName, 'utf-8');
		if (data.length == 0) {
			generatedMock = helper.GetHeaders(currentlyOpenFilePath) + generatedMock
			WriteToFile(currentlyOpenFilePath, fileName, generatedMock)
		}
		else {
			var position = GetPositionToAppendForMock(data)
			if (position < data.length) {
				generatedMock += data.substring(position)
				generatedMock += "\n"
				WriteToFile(currentlyOpenFilePath, fileName, generatedMock, position)

			}
			else {
				let messageObj = {
					message: generatedMock
				}
				position = GetPositionToAppendForTest(fileName, messageObj)
				WriteToFile(currentlyOpenFilePath, fileName, messageObj.message, position)

			}
		}
	}
}

function GetPositionToAppendForMock(text) {
	var position = 0;
	var length = text.length
	var lines = text.split("\n")
	for (var i = 0; i < lines.length; i++) {
		if (lines[i].includes("TYPED_TEST_SUITE")) {
			position -= ((lines[i - 1].length)+1)
			break
		}
		else {
			position += ((lines[i].length) + 1)
		}

	}
	return position
}

async function executeGtestTemplateCommand() {
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
		var shouldSelectFolder = true;
		var filePath = await GetUserEnteredFilePath(shouldSelectFolder, "")
		var absoluteFilePath
		var splitArg = "\\"
		if (filePath[0]) {
			if(filePath[0].fsPath.includes("/")){
				splitArg = "/"
			}
			absoluteFilePath = filePath[0].fsPath + splitArg

			prop[helper.GetSourceFileName(currentlyOpenTabfilePath)] = absoluteFilePath
			await testFile.update('TestFile', prop, vscode.ConfigurationTarget.Global).then(() => {

			})
			prop['useUserDefinedPath'] = "true"
			await testFile.update('TestFile', prop, vscode.ConfigurationTarget.Global).then(() => {
				console.log("Updated");
			})
		}
	}
	else if (prop['useUserDefinedPath'] == "true") {
		absoluteFilePath = prop[helper.GetSourceFileName(currentlyOpenTabfilePath)]
	}
	
	absoluteFilePath = absoluteFilePath + helper.GetSourceFileName(currentlyOpenTabfilePath)

	var fileName = absoluteFilePath.replace(".cpp", "") + "Test.cpp"
	console.log("file name is" + fileName)

	let messageObj = {
		message: generatedTest
	}
	var position = 0;
	if(fs.existsSync(fileName)){
	position = GetPositionToAppendForTest(fileName, messageObj)
	}
	WriteToFile(absoluteFilePath, fileName, messageObj.message, position)
}

function WriteToFile(absoluteFilePath, filename, message, position) {
	fs.open(filename, 'r', function (err, fd) {
		if (err) {
			fs.writeFile(filename, '', { mode: parseInt('777', 8) }, function (err) {
				if (err) {
					vscode.window.showInformationMessage("File cannot be opened.Check the path.")
				}
				message = helper.GetHeaders(absoluteFilePath) + '\n' + helper.AddNameSpace() + '\n' + helper.GetClassInitialization(absoluteFilePath) +
					"{" + helper.GetConstructorAndDestructor(absoluteFilePath) + "};" + message + "\n" + "}\n" + "}\n"
				let writer = fs.createWriteStream(filename, { flags: 'a+', start: position })
				writer.write(message)
			});
		} else {
			const buff = Buffer.from(message, "utf-8");
			var file = fs.openSync(filename,'r+');
			fs.writeSync(file,buff,0,buff.length,position)
			fs.close(file)
			vscode.window.showInformationMessage("Template generated")

		}
	});
}

async function GetUserEnteredFilePath(shouldSelectFolder, filter) {
	const APP_FILE = await vscode.window.showOpenDialog({
		filters: {
			filter
		},
		canSelectFolders: shouldSelectFolder,
		canSelectFiles: !shouldSelectFolder,
		canSelectMany: false,
		openLabel: 'Select',
	});

	if (!APP_FILE || APP_FILE.length < 1) {
		vscode.window.showInformationMessage("Enter a file path to create the template")
		return
	}
	console.log(APP_FILE)
	return APP_FILE
}

function GetPositionToAppendForTest(filename, messageObj) {
	var count = 0
	var text = ""
	const data = fs.readFileSync(filename, 'utf-8')
		messageObj.message += "\n"
		text = data.toString()

	var eachline = text.split('\n');
	for (var i in eachline) {
		var lineTrimmed = eachline[i].trim();
		if (lineTrimmed.startsWith("namespace")) {
			count++;
			messageObj.message += "}" + "\n";
		}
		if (eachline[i].includes("class") || eachline[i].includes("TYPED_TEST") || eachline[i].includes("TEST_F") || eachline[i].includes("TEST")) {
			break;
		}

	}
	var val = 0;
	var position = text.length - 1;
	while (val < count) {

		if (text.charAt(position) == "}") {
			val++;
		}
		position--;
	}

	return position;
}
//exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}





