const vscode = require('vscode');
var path = require('path');

//TODO:Fix name and type mismatch
//TODO:Refactor if else ladder and accomodate all types
function GetArgString(varList) {

	var stringToReturn = ""

	for (var i in varList) {
		var initializer = ""
		if (varList[i].name == "int" || varList[i].name == "DWORD") {
			initializer = "0"
		}
		else if (varList[i].name == "string") {
			initializer = '""'
		}
		else if(varList[i].name == "wstring"){
			initializer = 'L""'
		}

		if (initializer.length > 0)
			stringToReturn = stringToReturn + "\t" + varList[i].name + " " + varList[i].type + "=" + initializer + ';' + '\n'
		else
			stringToReturn = stringToReturn + "\t" + varList[i].name + " " + varList[i].type + ';' + '\n'

		console.log(stringToReturn)
	}

	return stringToReturn
}

function GetAssertString() {

	var stringToReturn = ""

	stringToReturn += "\t" + "EXPECT_TRUE" + "(2 == 2)" + ";" + "\n"
	stringToReturn += "\t" + "EXPECT_FALSE" + "(2 == 1)" + ";" + "\n"
	stringToReturn += "\t" + "EXPECT_EQUALS" + "(2, 2)" + ";" + "\n"


	return stringToReturn
}
function GetClassInitialization(currentlyOpenTabfilePath) {

	var testClassName = GetTestClassName(GetHeaderFileName(currentlyOpenTabfilePath))
	var baseClass = "public testing::Test"

	return "class " + testClassName + ":" + baseClass + "\n"
}

function AddNameSpace() {
	var stringToReturn =  "namespace unittest{\n"
            stringToReturn += "namespace UnitTesters {\n" +
             "using testing::_;\n" +
            "using testing::A;\n" +
            "using testing::An;" +
            "using testing::AnyNumber;\n" +
            "using testing::Const;\n" +
            "using testing::DoDefault;\n" +
            "using testing::Eq;\n" +
            "using testing::Lt;\n" +
            "using testing::MockFunction;\n" +
            "using testing::Ref;\n" +
            "using testing::Return;\n" +
            "using testing::ReturnRef;\n" +
            "using testing::TypedEq;\n" +
            "\n" +
            "template < typename T >\n" +

        "class TemplatedCopyable\n" +
        "{\n" +
            "public:\n" +
            "TemplatedCopyable() { }\n" +
            "\n" +
            "template<typename U>\n" +
            "TemplatedCopyable(const U& other) {}  // NOLINT\n" +
        "};\n";
            return stringToReturn;
        }

function GetTestClassName(className) {
	return className.replace(".h", "") + "Test";
}
function GetConstructorAndDestructor(currentlyOpenTabfilePath) {

	var stringToReturn = ""
	var testClassName = GetTestClassName(GetHeaderFileName(currentlyOpenTabfilePath))
	stringToReturn = "\n" + "public:" + "\n"
	stringToReturn += testClassName + "()" + "{" + "\n" + "}" + "\n"
	stringToReturn += "~" + testClassName + "()" + "{" + "\n" + "}" + "\n"
	return stringToReturn
}
function GetHeaders(currentlyOpenTabfilePath) {

	var className = GetHeaderFileName(currentlyOpenTabfilePath)


	var stringToReturn = ""

	stringToReturn += "#include " + '"gtest/gtest.h"' + "\n"
	stringToReturn += "#include " + '"gmock/gmock.h"' + "\n"
	stringToReturn += "#include " + '"' + className + '"' + "\n"


	return stringToReturn
}

function GetHeaderFileName(currentlyOpenTabfilePath) {
	currentlyOpenTabfilePath = currentlyOpenTabfilePath.replace(".cpp", ".h")
	var splitArg="\\"
	if(currentlyOpenTabfilePath.includes("/")){
		splitArg = "/"
	}
	const fileName = currentlyOpenTabfilePath.split(splitArg)
	return fileName[fileName.length - 1]
}

function GetSourceFileName(currentlyOpenTabfilePath) {
	return GetHeaderFileName(currentlyOpenTabfilePath).replace(".h", ".cpp")
}

function GetCurrentDirectory(currentlyOpenTabfilePath) {
	return path.dirname(currentlyOpenTabfilePath)
}


module.exports = {
	GetArgString,
	GetAssertString,
	GetHeaders,
	GetClassInitialization,
	GetConstructorAndDestructor,
	GetSourceFileName,
	GetCurrentDirectory,
	GetTestClassName,
	GetHeaderFileName,
	AddNameSpace
}


