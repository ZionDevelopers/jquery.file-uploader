/*!
 * jQuery Ajax Easy File Uploader MK2
 * http://jquery.com/
 *
 * Copyright 2016 Júlio César <talk@juliocesar.me>
 * Released under the MIT license
 * http://jquery.org/license
 *
 */
/*jslint nomen: true, unparam: true, regexp: true */
/*global define, window, document, location, FormData */

(function (factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // Register as an anonymous AMD module:
        define([
            'jquery',
            'jquery.ui.widget'
        ], factory);
    } else {
        // Browser globals:
        factory(window.jQuery);
    }
}(function ($) {
    'use strict';

    $.widget('jFramework.fileuploader', {
        // Options
        options: {
            url: null,
            dropzone: null,
            autoUpload: true,
            acceptablefileExtensionsRegex: /(gif|jpe?g|png)$/i,
            acceptablefileExtensionsReadable: 'gif, jpeg, jpg or png',
            maxFileSize: 2*1024*1024,
            maxWidth: 0,
            maxHeight: 0,
            limitConcurrentUploadRequests: 5,
            queueInterval: 10,
            messages: {
                fileTooBigSize: 'File %s is too big, Send files smaller than %dMB!',
                fileTypeNotAllowed: 'File %s type is %s and is not allowed!, Send only %s!',
                fileTooBigWidth: 'File %s is too big, Send images equal or lower than %d pixels of width!',
                fileTooBigHeight: 'File %s is too big, Send images equal or lower than %d pixels of height!'
            }
        },  
        
        // Total stats
        _totalSize: 0,
        _totalSentSize: 0,
        _totalPercentage: 0,
        
        // Detect file input support, based on
        // http://viljamis.com/blog/2012/file-upload-support-on-mobile/
        _fileInputSupport: !(new RegExp(
            // Handle devices which give false positives for the feature detection:
            '(Android (1\\.[0156]|2\\.[01]))' +
                '|(Windows Phone (OS 7|8\\.0))|(XBLWP)|(ZuneWP)|(WPDesktop)' +
                '|(w(eb)?OSBrowser)|(webOS)' +
                '|(Kindle/(1\\.0|2\\.[05]|3\\.0))'
                                            // Feature detection for all other devices:
        ).test(window.navigator.userAgent) || $('<input type="file">').prop('disabled')),
        
        // Define format
        // @source: Ash Searle (http://hexmen.com/blog/)
        _format: function () {
            var regex = /%%|%(\d+\$)?([\-+\'#0 ]*)(\*\d+\$|\*|\d+)?(?:\.(\*\d+\$|\*|\d+))?([scboxXuideEfFgG])/g;
            var a = arguments;
            var i = 0;
            var format = arguments[i++];

            // pad()
            var pad = function(str, len, chr, leftJustify) {
              if (!chr) {
                chr = ' ';
              }
              var padding = (str.length >= len) ? '' : new Array(1 + len - str.length >>> 0)
                .join(chr);
              return leftJustify ? str + padding : padding + str;
            };

            // justify()
            var justify = function(value, prefix, leftJustify, minWidth, zeroPad, customPadChar) {
              var diff = minWidth - value.length;
              if (diff > 0) {
                if (leftJustify || !zeroPad) {
                  value = pad(value, minWidth, customPadChar, leftJustify);
                } else {
                  value = value.slice(0, prefix.length) + pad('', diff, '0', true) + value.slice(prefix.length);
                }
              }
              return value;
            };

            // formatBaseX()
            var formatBaseX = function(value, base, prefix, leftJustify, minWidth, precision, zeroPad) {
              // Note: casts negative numbers to positive ones
              var number = value >>> 0;
              prefix = (prefix && number && {
                '2'  : '0b',
                '8'  : '0',
                '16' : '0x'
              }[base]) || '';
              value = prefix + pad(number.toString(base), precision || 0, '0', false);
              return justify(value, prefix, leftJustify, minWidth, zeroPad);
            };

            // formatString()
            var formatString = function(value, leftJustify, minWidth, precision, zeroPad, customPadChar) {
              if (precision !== null && precision !== undefined) {
                value = value.slice(0, precision);
              }
              return justify(value, '', leftJustify, minWidth, zeroPad, customPadChar);
            };

            // doFormat()
            var doFormat = function(substring, valueIndex, flags, minWidth, precision, type) {
              var number, prefix, method, textTransform, value;

              if (substring === '%%') {
                return '%';
              }

              // parse flags
              var leftJustify = false;
              var positivePrefix = '';
              var zeroPad = false;
              var prefixBaseX = false;
              var customPadChar = ' ';
              var flagsl = flags.length;
              var j;
              for (j = 0; flags && j < flagsl; j++) {
                switch (flags.charAt(j)) {
                case ' ':
                  positivePrefix = ' ';
                  break;
                case '+':
                  positivePrefix = '+';
                  break;
                case '-':
                  leftJustify = true;
                  break;
                case "'":
                  customPadChar = flags.charAt(j + 1);
                  break;
                case '0':
                  zeroPad = true;
                  customPadChar = '0';
                  break;
                case '#':
                  prefixBaseX = true;
                  break;
                }
              }

              // parameters may be null, undefined, empty-string or real valued
              // we want to ignore null, undefined and empty-string values
              if (!minWidth) {
                minWidth = 0;
              } else if (minWidth === '*') {
                minWidth = +a[i++];
              } else if (minWidth.charAt(0) === '*') {
                minWidth = +a[minWidth.slice(1, -1)];
              } else {
                minWidth = +minWidth;
              }

              // Note: undocumented perl feature:
              if (minWidth < 0) {
                minWidth = -minWidth;
                leftJustify = true;
              }

              if (!isFinite(minWidth)) {
                throw new Error('sprintf: (minimum-)width must be finite');
              }

              if (!precision) {
                precision = 'fFeE'.indexOf(type) > -1 ? 6 : (type === 'd') ? 0 : undefined;
              } else if (precision === '*') {
                precision = +a[i++];
              } else if (precision.charAt(0) === '*') {
                precision = +a[precision.slice(1, -1)];
              } else {
                precision = +precision;
              }

              // grab value using valueIndex if required?
              value = valueIndex ? a[valueIndex.slice(0, -1)] : a[i++];

              switch (type) {
              case 's':
                return formatString(String(value), leftJustify, minWidth, precision, zeroPad, customPadChar);
              case 'c':
                return formatString(String.fromCharCode(+value), leftJustify, minWidth, precision, zeroPad);
              case 'b':
                return formatBaseX(value, 2, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
              case 'o':
                return formatBaseX(value, 8, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
              case 'x':
                return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
              case 'X':
                return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad)
                  .toUpperCase();
              case 'u':
                return formatBaseX(value, 10, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
              case 'i':
              case 'd':
                number = +value || 0;
                // Plain Math.round doesn't just truncate
                number = Math.round(number - number % 1);
                prefix = number < 0 ? '-' : positivePrefix;
                value = prefix + pad(String(Math.abs(number)), precision, '0', false);
                return justify(value, prefix, leftJustify, minWidth, zeroPad);
              case 'e':
              case 'E':
              case 'f': // Should handle locales (as per setlocale)
              case 'F':
              case 'g':
              case 'G':
                number = +value;
                prefix = number < 0 ? '-' : positivePrefix;
                method = ['toExponential', 'toFixed', 'toPrecision']['efg'.indexOf(type.toLowerCase())];
                textTransform = ['toString', 'toUpperCase']['eEfFgG'.indexOf(type) % 2];
                value = prefix + Math.abs(number)[method](precision);
                return justify(value, prefix, leftJustify, minWidth, zeroPad)[textTransform]();
              default:
                return substring;
              }
            };

            return format.replace(regex, doFormat);
        },

        // Define validate function
        _validate: function (uploadList) {
            var that = this;
            // Loop
            $.each(uploadList, function (index, file) {
                // Check filesize
                if (file.size > that.options.maxFileSize) {                    
                    // Formated Error
                    var error = that._format(that.options.messages.fileTooBigSize, file.name, (that.options.maxFileSize/1024/1024));
                    // Call file_add callback
                    that._trigger('file_add', null, {file: file, error: error});
                } else {
                    // Get file extension
                    file.extension = file.name.split('.').pop();
                    
                    // Check if extension is allowed
                    if (!that.options.acceptablefileExtensionsRegex.test(file.extension)) {
                        // Format error message
                        var error = that._format(that.options.messages.fileTypeNotAllowed, file.name, file.extension, that.options.acceptablefileExtensionsReadable);
                        // Call file_add callback
                        that._trigger('file_add', null, {file: file, error: error});
                    } else { 
                        // Check if file size checking is required
                        if (that.options.maxWidth > 0 || that.options.maxHeight > 0) {
                            // Init new Image
                            var img = new Image();                            

                            // OnLoad callback
                            img.onload = function () {
                                var width = that.width;
                                var height = that.height;
                                that._imageCheck(that, file, width, height);
                            };

                            // Define file URL
                            img.src = that._url.createObjectURL(file);
                        } else {
                            that._addFileToQueue(file);
                        }
                    }
                }
            });
        },
        
        // Define Image Check function
        _imageCheck: function (that, file, width, height) {
            // Check if maxWidth is required
            if (that.options.maxWidth > 0 && that.options.maxHeight > 0) {
                // Check if image width is bigger and maxWidth
                if (width > that.options.maxWidth) {
                    // Format error message
                    var error = that._format(that.options.messages.fileTooBigWidth, file.name, that.options.maxWidth);
                    // Call file_add callback
                    that._trigger('file_add', null, {file: file, error: error});
                } else {                                    
                    // Check if image height is bigger and maxHeight
                    if (height > that.options.maxHeight) {
                        // Format error message
                        var error = that._format(that.options.messages.fileTooBigHeight, file.name, that.options.maxHeight);
                        // Call file_add callback
                        that._trigger('file_add', null, {file: file, error: error});                                   
                    } else {
                        that._addFileToQueue(file);
                    }
                }                                    
            } else {
                // Check if maxWidth is required
                if (that.options.maxWidth > 0) {
                    // Format error message
                    var error = that._format(that.options.messages.fileTooBigWidth, file.name, that.options.maxWidth);
                    // Call file_add callback
                    that._trigger('file_add', null, {file: file, error: error});
                // Check if maxHeight
                } else if (that.options.maxHeight > 0) {
                    // Format error message
                    var error = that._format(that.options.messages.fileTooBigHeight, file.name, that.options.maxHeight);
                    // Call file_add callback
                    that._trigger('file_add', null, {file: file, error: error});
                } else {
                    that._addFileToQueue(file);
                }
            }
        },

        // Generate an Unique ID
        _getGUID: function (){
            var d = new Date().getTime();
            if(window.performance && typeof window.performance.now === "function"){
                d += performance.now(); //use high-precision timer if available
            }
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (d + Math.random()*16)%16 | 0;
                d = Math.floor(d/16);
                return (c=='x' ? r : (r&0x3|0x8)).toString(16);
            });
            return uuid;
        },


        /**
         * Calculate the sum of one object
         * @param {Object} object
         * @returns {Number}
         */
        _sum: function (object, key) {
            var total = 0;
            $.each(object, function (index, item) {
                total += parseInt(item[key]);
            });

            return total;
        },

        // Define function to upload a file
        _uploadFile: function (file) {
            // Callback
            this._trigger('file_upload_started', null, {file: file});
            // Add default
            this.queueUploading[file.uid] = file;
            
            // Define that like this
            var that = this;

            // Define data to post
            var dataToPost = new FormData();
            // Append to upload
            dataToPost.append('file', file.file, file.file.name);

            // Start Ajax Request
            $.ajax({
                url: this.options.url,
                dataType: 'json',
                method: 'POST',
                data: dataToPost,                
                cache: false,
                enctype: "multipart/form-data",
                contentType: false,
                processData: false,
                xhr: function () {
                    var xhr;

                    // Check for Ajax Object
                    if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
                        xhr = new XMLHttpRequest();
                    } else {// code for IE6, IE5
                        xhr = new ActiveXObject('Microsoft.XMLHTTP');
                    }

                    // Add request to list
                    that.queueUploading[file.uid].xhr = xhr;

                    // Add event complete listener
                    xhr.addEventListener('loadend', function () {                            
                        // Set queue as completed
                        that.queueUploading[file.uid].completed = true;

                        // Copy queue Uploading to Completed
                        that.queueCompleted[file.uid] = that.queueUploading[file.uid];

                        // Remove upload from queue
                        that.queueUploading[file.uid] = undefined;
                        delete that.queueUploading[file.uid];                              

                        // Add result to queue
                        that.queueCompleted[file.uid].success = xhr.status === 200;
                        that.queueCompleted[file.uid].result = xhr.status === 200 ? JSON.parse(xhr.responseText) : null;                    

                        // Callback
                        that._trigger('file_upload_finished', null, {queue: that.queueCompleted[file.uid]});

                        // Check if upload is the last and is there no more files on the Wait List
                        if (Object.keys(that.queueUploading).length === 0 && Object.keys(that.queueWaitList).length === 0) { 

                            // Callback end
                            that._trigger('done', null, {queue: that.queueCompleted, time: (new Date()).toLocaleString()});
                            
                            // Define state
                            that.started = false;
                            that.finished = true;
                            
                            // Calc total size of files
                            that._calcTotal();
                            // Calc total size of sent files
                            that._calcTotalSent();
                            // Calc total 
                            that._totalPercentage = ((that._totalSentSize / that._totalSize)*100).toFixed(2);
                            
                            // Callback total progress
                            that._trigger('progress', null, {sent: Object.keys(that.queueCompleted).length, total: Object.keys(that.queueCompleted).length, queue: that.queueUploading, percentage: that._totalPercentage, uploadSent: that._totalSentSize, uploadTotal: that._totalSize});
                            
                            // Reset
                            that.queueWaitList = {};
                            that.queueCompleted = {};
                            that.queueUploading = {};
                        }
                    }); 

                    // Progress track
                    xhr.upload.addEventListener('progress', function (e) {
                        // Check if length is computable
                        if (e.lengthComputable) {    
                            
                            // Add events to queue
                            that.queueUploading[file.uid].events = e;
                            that.queueUploading[file.uid].file = file;

                            var sent = Object.keys(that.queueCompleted).length;

                            var total = Object.keys(that.queueUploading).length;
                            total += Object.keys(that.queueWaitList).length;
                            total += sent;
                            
                            file.uploadProgress = parseInt((e.loaded / e.total)* 100);
                            file.uploadSent = e.loaded;
                            file.uploadTotal = e.total;

                            // Callback file progress
                            that._trigger('file_progress', null, {sent: sent, total: total, file: file});
                                                        
                            that._calcTotal();
                            that._calcTotalSent();
                            that._totalPercentage = ((that._totalSentSize / that._totalSize)*100).toFixed(2);

                            // Callback total progress
                            that._trigger('progress', null, {sent: sent, total: total, queue: that.queueUploading, percentage: that._totalPercentage, uploadSent: that._totalSentSize, uploadTotal: that._totalSize});
                        }
                    }, false);

                    return xhr; 
                }
            });
        },

        // Define function to add files to queue
        _addFileToQueue: function (file) {
            // Get unique ID
            var uid = this._getGUID(); 

            // Add file to queue
            this.queueWaitList[uid] = {xhr: null, events: {}, uid: uid, file: file, size: file.size, uploadProgress: 0, uploadSent: 0, uploadTotal: 0};

            // Call file_add callback
            this._trigger('file_add', null, {queue: this.queueWaitList[uid]});

            // Check if autoUpload is enabled
            if (this.options.autoUpload && !this.started) {
                // Callback
                this.start(this.queueWaitList);
            }
        },

        // Define proccess queue function
        _proccessQueue: function (that) {
            // Check if queue is not empty
            if (Object.keys(that.queueWaitList).length) {             
                // Check if current number of uploads is lesser then the limit                
                if (that.options.limitConcurrentUploadRequests > Object.keys(that.queueUploading).length) {
                    
                    // Get current key
                    var currentI = Object.keys(that.queueWaitList)[0];

                    // Get current
                    var current = that.queueWaitList[currentI];
                    
                    // Copy wait list item to Uploading
                    that.queueUploading[current.uid] = current;
                    // Remove element
                    that.queueWaitList[currentI] = undefined;
                    delete that.queueWaitList[currentI];

                    // Start file upload 
                    that._uploadFile(current);
                }
            } else {
                // Clear interval
                clearInterval(that.queueIntervalId);                   
            }                           
        },

        // Define function to start upload proccess
        start: function () {
            // Check if upload was not started
            if (!this.started) {
                // Start process
                this.started = true;
                this._trigger('started', null, {time: (new Date()).toLocaleString()});
                var that = this;

                // Run queue                 
                this.queueIntervalId = setInterval(function () {
                    that._proccessQueue(that);
                },  this.options.queueInterval);
            }
        },   
        
        // Pause upload
        stop: function () {
            // Clear interval
            clearInterval(this.queueIntervalId);
            // Stop
            this.started = false;
            // Trigger stop
            this._trigger('stopped', null, {time: (new Date()).toLocaleString()});
            
            this.queueWaitList = {};
            this.queueCompleted = {};
            this.queueUploading = {};
        }, 

        // Stop upload and abort all requests
        abortAll: function () {
            // Clear interval
            clearInterval(this.queueIntervalId);
            // Stop 
            this.started = false;
            
            var that = this;

            // Loop by all currently uploading files
            $.each(this.queueUploading, function (index, file) {
                // Abort upload request
                file.xhr.abort();
                // Call abort callback
                that._trigger('file_upload_aborted', null, {file: file});
            });

            // Call abort callback
            this._trigger('aborted', null, {queue: this.queueUploading});
            
            this.queueWaitList = {};
            this.queueCompleted = {};
            this.queueUploading = {};
            
            // Clear interval
            clearInterval(this.queueIntervalId);   
            
            //this._destroy();
        },
        
        _setOption: function( key, value ) {
            this.options[ key ] = value;
            //this._update(); 
        },
        
        _drag: function (event) {
            event.stopPropagation();
            event.preventDefault();
       },
       
        _calcTotal: function (){
            // Loop by all files
            var that = this;
            this._totalSize = 0;
            
            $.each(this.queueUploading, function (index, row) {            
                that._totalSize += row.size;                
            });
            
            $.each(this.queueCompleted, function (index, row) {            
                that._totalSize += row.size;
            });
            
            $.each(this.queueWaitList, function (index, row) {            
                that._totalSize += row.size;
            });
            
            return this._totalSize;
        },
        
        
        /**
         * Calculate the percentage of two objects
         * @param {Object} object1
         * @param {Object} object2
         * @returns {Number}
         */
        _calcTotalSent: function () {
             // Loop by all files
            var that = this;
            this._totalSentSize = 0;
            
            $.each(this.queueUploading, function (index, row) {      
                if (parseInt(row.file.uploadSent) > 0) {
                    that._totalSentSize += row.file.uploadSent;                 
                }
            });
            
            $.each(this.queueCompleted, function (index, row) {                
                that._totalSentSize += row.file.uploadSent;
            });
            
            return this._totalSentSize;
        },

        _create: function() {
            // Define URL
            this.url = window.URL || window.webkitURL;

            // Define Process queue variables
            this.started = false;
            this.finished = false;

            // Define queue vars
            this.queueUploading = {};
            this.queueWaitList = {};
            this.queueCompleted = {};
            this.queueIntervalId = 0;
            
            var that = this;
            
            // Check if browser have support to input type file
            if (this._fileInputSupport) {
                // Add trigger on input
                $(this.element).change(function (event) {
                    // Start validate proccess
                    that._validate(event.target.files || event.dataTransfer.files || event.originalEvent.dataTransfer.files);     
                });
            }
            
            // Check if dropzone exists
            if ($(this.options.dropzone).length) {
                // Attach event handlers
               $(this.options.dropzone).on('drag dragstart dragend dragover dragenter dragleave drop', that._drag).on('drop', function (event) {
                   that._validate(event.originalEvent.dataTransfer.files);
                   return false;
               });
            }
        },
        _destroy: function () {
            // Define URL
            this.url = window.URL || window.webkitURL;

            // Define Process queue variables
            this.started = false;
            this.finished = false;

            // Define queue vars
            this.queueUploading = {};
            this.queueWaitList = {};
            this.queueCompleted = {};
            this.queueIntervalId = 0;
            
            delete this;
        }
    });
}));
