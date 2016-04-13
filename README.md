# jQuery File Uploader
This is an easy to use Ajax File Uploader with support for validation of file size, image width and image height, file extension check, DropZone support, Parallel (Concurrent) file uploads, You can upload one by one or how many you want!.
It also have customizable error messages, and lots of event triggers to get the status of the upload!


Code Example:
```JS
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
