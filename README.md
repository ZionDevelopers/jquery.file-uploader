# jQuery File Uploader
This is an easy to use Ajax File Uploader.

###Features:

* File Validation:
  * File size
  * Image width and image height
  * File extension check
* DropZone support
* Parallel (Concurrent) file uploads: You can upload one by one or how many you want!
* Customizable error messages
* Lots of event triggers to get the status of the upload!

###Options
```javascript
{
	url: '/upload-url', // URL to send the files
	dropzone: 'div#my-dropzone', // jQuery Selector of the dropzone element
	autoUpload: true, // Automatically upload files as they are added
	acceptablefileExtensionsRegex: /(gif|jpe?g|png)$/i, // REGEX of the file extensions that you will accept
	acceptablefileExtensionsReadable: 'gif, jpeg, jpg or png', // Readable text of extensions allowed, Used on the error messages
	maxFileSize: 2*1024*1024, // Max file size allowed (IN BYTES): 2MB
	maxWidth: 0, // Max image with
	maxHeight: 0, // Max image height
	limitConcurrentUploadRequests: 5, // Limit of parallel (Concurrent) ajax file upload  
	queueInterval: 10, // Interval of the queue processor
	messages: { // Error messages
		fileTooBigSize: 'File %s is too big, Send files smaller than %dMB!',
		fileTypeNotAllowed: 'File %s type is %s and is not allowed!, Send only %s!',
		fileTooBigWidth: 'File %s is too big, Send images equal or lower than %d pixels of width!',
		fileTooBigHeight: 'File %s is too big, Send images equal or lower than %d pixels of height!'
	}
}
```

###Example:
```javascript
 $('input#file_uploader_input').fileuploader({
        url: '/myupload/upload.php?album_id='+$('form#my-form').data('id'),
        dropzone: 'div#my-dropzone',
        acceptablefileExtensionsRegex: /(jpe?g|png)$/i,
        acceptablefileExtensionsReadable: 'jpeg, jpg or png',
        maxFileSize: 5*1024*1024
    })
        .bind('fileuploaderprogress', function (event, data) {             
            var percent = parseInt(data.percentage);
            $('div#my-progress div.progress-bar').css({width: percent+'%s'});
            $('div#my-progress div.percentage').html(percent+'%');
            $('div#my-progress span.done').html(data.sent);
            $('div#my-progress span.total').html(data.total);

            // Check if done
            if (data.sent == data.total) {
                $('div#cancelAllUploads').fadeOut();
                window.uploadsDone = window.uploadsTotal;
            }
        })
        .bind('fileuploaderfile_add', function (event, data) {
            if(typeof data.error !== 'undefined') {
                alert(data.error);
            }
        })
        .bind('fileuploaderstarted', function (event, data) {            
            $('div#cancelAllUploads').fadeIn();
            $('div#my-progress').slideDown();
            $('div#photos-container').fadeOut();
        })
        .bind('fileuploaderstopped fileuploaderdone fileuploaderaborted', function (event, data) {
            $('div#cancelAllUploads').fadeOut();
        });
```
### Events
* started: Upload process started. `event: eventObject, data: {time: '13/04/2016 10:49:17'}`
* stopped: Upload process stopped. `event: eventObject, data: {time: '13/04/2016 10:50:20'}`
* file_add: A file was added. `event: eventObject, data: {file: fileObject, error: 'Error XYZ'}`
* file_upload_started: A file upload was started. `event: eventObject, data: {file: fileObject}`
* file_upload_finished: A file upload has finished. `event: eventObject, data: {queue: queueObject}`
* file_progress: Progress of a file upload. `event: eventObject, data: {sent: 1, total: 2, file: fileObject}}`
* progress: Upload progress of all files. `event: eventObject, data: {sent: 1, total: 2, queue: queueObject, percentage: 50, uploadSent: 1000, uploadTotal: 2000}`
* file_upload_aborted: File upload has been aborted. `event: eventObject, data: {file: fileObject}`
* aborted: Upload process has been aborted. `event: eventObject, data: {queue: queueObject}`
* done: Upload process has been finished. `event: eventObject, data: {queue: queueObject, time: '13/04/2016 10:51:25'}`

All events trigger sends event and data object, Each event my vary the objects.
