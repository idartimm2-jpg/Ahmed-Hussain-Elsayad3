const FOLDER_ID = '1O_mrTJbPRil23s26Z4u5sWPmH0P63yvr';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (!FOLDER_ID || FOLDER_ID === 'YOUR_FOLDER_ID_HERE') {
      throw new Error("لم يتم ضبط FOLDER_ID في برمجة تطبيقات Google (Apps Script)");
    }

    const parentFolder = DriveApp.getFolderById(FOLDER_ID);
    
    // Get or create subfolder for this submission
    let folder = parentFolder;
    if (data.folderName) {
      const folders = parentFolder.getFoldersByName(data.folderName);
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = parentFolder.createFolder(data.folderName);
        folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      }
    }

    // Decode base64
    const contentType = data.mimetype;
    const bytes = Utilities.base64Decode(data.base64);
    const blob = Utilities.newBlob(bytes, contentType, data.filename);
    
    // Create file in the subfolder
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      url: file.getUrl(),
      folderUrl: folder.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function testScript() {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    Logger.log("تم الاتصال بالمجلد بنجاح: " + folder.getName());
  } catch (e) {
    Logger.log("خطأ في الاتصال: " + e.toString());
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Service is running");
}
