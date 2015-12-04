(function () {
define('annoCgscript',[],function () {
    //{"call":{"__type":"WorkflowCallInfo:Catglobe.Web.Services","ResourceId":261411,"Parameters":["1 || 4","set","1-4","1"]}}

   function convertToJsObject(wfResult) {
      var jsObject, i;

      if (wfResult instanceof Array && wfResult.length > 0 && wfResult[0] !== null && wfResult[0].__type !== undefined) {
         jsObject = {};
         for (i = 0; i < wfResult.length; i++)
            jsObject[wfResult[i].key] = convertToJsObject(wfResult[i].value);
      } else if (wfResult instanceof Array) {
         jsObject = [];
         for (i = 0; i < wfResult.length; i++)
            jsObject.push(convertToJsObject(wfResult[i]));
      } else {
         jsObject = wfResult;
      }

      return jsObject;
   }

   function convertToKvpArray(jsObject) {
      var kvpArray = [];
      if (jsObject === null) {
         // Null is converted to an array with one entry where the key is null
         kvpArray.push({
            __type: 'KeyValuePairOfstringanyType:#System.Collections.Generic',
            key: null,
            value: null
         });
         return kvpArray;
      } else if (jsObject instanceof Array) {
         for (var i = 0; i < jsObject.length; i++)
            kvpArray.push(convertToKvpArray(jsObject[i]));
         return kvpArray;
      } else if (jsObject instanceof Object) {
         // Convert the object to a key-value-pair array matching the Dictionary object in CGS
         for (var k in jsObject)
            kvpArray.push({
               __type: 'KeyValuePairOfstringanyType:#System.Collections.Generic',
               key: k,
               value: convertToKvpArray(jsObject[k])
            });
         return kvpArray;
      }
      return jsObject;
   }

   var resultType = { Error: 1, Empty: 2, Boolean: 3, Number: 4, String: 5, Array: 9, Question: 10, Object: 13 };

   function c(id, p, undefined, ajaxSettings) {
       var d = new $.Deferred();
       var httpPost = function (url, data, ajaxSettings) {
            var settings = {
                url: url,
                data: ko.toJSON(data),
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json'
            };
            if ($.isPlainObject(ajaxSettings))
                $.extend(settings, ajaxSettings);
            return $.ajax(settings);
      };
 
      httpPost('/Services/External/WorkflowService.svc/RunWorkflow', {
         call: {
            __type: "WorkflowCallInfo:Catglobe.Web.Services",
            ResourceId: id,
            Parameters: p
         }
      }, ajaxSettings).done(function (r) {
         r = r.d;
         if (r.Type == resultType.Error) {
            d.reject(0, 'An error occurred:', r);
            return;
         }
         d.resolve(convertToJsObject(r.Result), r.Type);
      }).fail(function (err) {
         d.reject(1, 'An error occurred:', err.get_message ? err.get_message() : err.statusText);
      });
      return d.promise();
   }

   return function (id) {
      return {
         resultTypes: resultType,
         call: function (methodName, methodArguments, undefined, ajaxSettings) {
             return c(id, [methodName, convertToKvpArray(ko.toJS(methodArguments))], undefined, ajaxSettings);
         },
         run: function (wfArguments, undefined, ajaxSettings) {
             return c(id, [convertToKvpArray(ko.toJS(wfArguments))], undefined, ajaxSettings);
         },
         runArrayParam: function (wfArguments, undefined, ajaxSettings) {
            if (!(wfArguments instanceof Array))
               throw new Error("Invalid parameters: 1st param is not an array");
            return c(id, convertToKvpArray(ko.toJS(wfArguments)), undefined, ajaxSettings);
         }
      };
   };
});


define('annojs/app',['annoCgscript'], function (annoCgscript) {

    /////////////////////
    // Helpers
    /////////////////////
    Array.prototype.insert = function (index, item) {
        this.splice(index, 0, item);
    };

    /////////////////////
    // annoAPP Class
    /////////////////////
    var annoAPP = function (siteName, parentAppName, appInstanceId, appCaller, map, hideItemOrder, showApp /* Boolean - Optional, default is true */) {
        annoAPP.siteName = siteName;
        annoAPP.parentAppName = parentAppName;
        annoAPP.cssClass = annoAPP.getCssClass(siteName, parentAppName);
        annoAPP.resourceTxts = annoAPP.getResourceTxts(siteName, parentAppName);
        annoAPP.setAppBackend(siteName, parentAppName);        

        this.appInstanceId = appInstanceId;
        this.appCaller = appCaller;
        this.map = map;
        this.hideItemOrder = hideItemOrder;
        if (showApp === undefined)
            showApp = true;
        else
            showApp = showApp;        
        if(showApp)
            this.appCaller();
    };

    annoAPP.siteName = null;
    annoAPP.parentAppName = null;
    annoAPP.appBackend = null;
    annoAPP.cssClass = null;
    annoAPP.resourceTxts = null;
    annoAPP.getCssClass = function (siteName, parentAppName) {
        return {
            logo: 'spr-' + siteName + 'logo',
            moveUpButtonIcon: 'glyphicon glyphicon-chevron-up',         // Bootstrap Glyphicons
            moveDownButtonIcon: 'glyphicon glyphicon-chevron-down',     // Bootstrap Glyphicons
            addButtonIcon: 'glyphicon glyphicon-plus',                  // Bootstrap Glyphicons
            removeButtonIcon: 'glyphicon glyphicon-trash'               // Bootstrap Glyphicons
        };
    };
    annoAPP.getResourceTxts = function (siteName, parentAppName) {
        return {
            loading: '',
            select: 'Vælg...',
            save: 'Gem',
            saving: 'Gem...',
            saved: 'Gem!',
            'delete': 'Slet',
            deleting: 'Sletning...',
            close: 'Luk',
            yes: 'Ja',
            no: 'Nej',
            search: 'Søg',
            createNew: 'Opret',
            administration: 'Administrér'
        };
    };
    annoAPP.setAppBackend = function () {         
        // Define the app workflow rid (cgs file) here
        var appBackendsList = {
            cem: {
                cembank: 37282488
            },
            cg: {
                cemngo: 550863
            },
            economy: {
                economy: 13327866
            },
            coop: {
                cockpit: 1865137
            }
        };        
        this.appBackend = window.location.hostname === 'localhost' ? 'AnnotationSetApp' : appBackendsList[this.siteName][this.parentAppName];
    };
    annoAPP.styleColors = {
        "text": "blue",
        "0": "#000000",       // Default
        "1": "#EEEEEE",       // Light grey
        "2": "#6698FF",       // Sky blue
        "3": "#FF0000",       // Red
        "4": "#00FF7F",       // Spring green
        "5": "#8B4513",       // Saddle brown
        "6": "#DAA520",       // Golden rod
        "7": "#FF00FF",       // Magenta
        "8": "#008000"        // Green
    };

    annoAPP.contrastingColor = function (color) {
        function luma(color) { // color can be a hx string or an array of RGB values 0-255   
            var rgb = (typeof color === 'string') ? hexToRGBArray(color) : color;
            return (0.2126 * rgb[0]) + (0.7152 * rgb[1]) + (0.0722 * rgb[2]); // SMPTE C, Rec. 709 weightings
        };

        function hexToRGBArray(color) {
            if (color.length === 3)
                color = color.charAt(0) + color.charAt(0) + color.charAt(1) + color.charAt(1) + color.charAt(2) + color.charAt(2);
            else if (color.length !== 6)
                throw ('Invalid hex color: ' + color);
            var rgb = [];
            for (var i = 0; i <= 2; i++)
                rgb[i] = parseInt(color.substr(i * 2, 2), 16);
            return rgb;
        }
        color = color.replace('#', '');
        return (luma(color) >= 165) ? '#000' : '#fff';
    }

    annoAPP.hex2rgb = function (hex, opacity) {
        var rgb = hex.replace('#', '').match(/(.{2})/g);
        var i = 3;
        while (i--) {
            rgb[i] = parseInt(rgb[i], 16);
        }
        if (typeof opacity == 'undefined') {
            return 'rgb(' + rgb.join(', ') + ')';
        }
        return 'rgba(' + rgb.join(', ') + ', ' + opacity + ')';
    }

    annoAPP.isNumber = function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };

    annoAPP.isPositiveInteger = function (n) {
        return 0 === n % (!isNaN(parseFloat(n)) && 0 <= ~~n);
    };

    annoAPP.isEmail = function (str) {
        var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
        if (!reg.test(str))
            return false;
        else
            return true;
    };

    annoAPP.sortByName = function (items /* array type */, index /* string type if array elements are object, number type if array elements are arrays */, order /* value: asc, dsc */) {
        items.sort(function (a, b) {
            var _a, _b;
            if (typeof index === 'number') {
                _a = a[index].toLowerCase();
                _b = b[index].toLowerCase();
            }

            if (typeof index === 'string') {
                if (index === '') {
                    _a = a.toLowerCase();
                    _b = b.toLowerCase();
                }
                else {
                    _a = a[index].toLowerCase();
                    _b = b[index].toLowerCase();
                }
            }

            if (order === 'dsc')
                return ((_a > _b) ? -1 : ((_a < _b) ? 1 : 0));		// sort dsc
            else
                return ((_a < _b) ? -1 : ((_a > _b) ? 1 : 0));		// sort asc
        });
        return items;
    };

    annoAPP.objectToArray = function (obj) {
        var arr = [];
        for (var key in obj)
            if (obj.hasOwnProperty(key))
                arr.push({ key: key, val: obj[key] });
        return arr;
    };

    annoAPP.dialogBox = function (content, options, divID) {
        var opts = {
            dialogClass: this.appName + '-dialogBox',
            width: 450,
            minHeight: 0,
            draggable: false,
            create: function () {
                $('div.ui-dialog-titlebar').remove();  // Remove dialog title bar
            },
            close: function () {
                $(this).remove();
            }
        };

        if ($.isPlainObject(options))
            $.extend(opts, options);

        if(divID)
            return $('<div id="' + divID + '">').append(content).dialog(opts);
        else
            return $('<div>').append(content).dialog(opts);
    };

    annoAPP.waitingBoxesList = [];
    annoAPP.closeAllWaitingBoxes = function () {
        var self = this;
        $.each(self.waitingBoxesList, function (i) {
            self.closeWaitingBox(self.waitingBoxesList[0]);
        });
    };

    annoAPP.showWaitingBox = function (waitingText) {
        var progressBar, box;
        waitingText = waitingText ? waitingText : '';
        progressBar = '<div class="progress">'
                    + '<div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%;background-color: #545454;">' + waitingText + '</div>'
                    + '</div>'; 
        box = this.dialogBox(progressBar, {
            modal: true,
            width: '200px'
        });
        box.parent().removeClass('ui-widget-content');
        box.removeClass('ui-dialog-content ui-widget-content');
        box.siblings('.ui-icon').removeClass('ui-icon');
        this.waitingBoxesList.push(box);
        return box;        
    };

    annoAPP.closeWaitingBox = function (box) {
        try {
            box.dialog('destroy').remove();
        } catch (e) {}
        var index = this.waitingBoxesList.indexOf(box);
        if (index > -1)
            this.waitingBoxesList.splice(index, 1);
    };

    annoAPP.generateSingleSelectionList = function (elementClass, optionsList /* array type */, selectedVal /* optional */) {
        return $('<select>', { 'class': elementClass })
            .append(function () {
                var options = [];
                $.each(optionsList, function (i, optionArray) {
                    options.push($('<option>').attr('value', optionArray[0]).text(optionArray[1]));
                });
                if (selectedVal)
                    $.each(options, function (i, optionElement) {
                        if (optionElement.val() == selectedVal) {
                            optionElement.attr('selected', true);
                            return false; // break this loop
                        }
                    });
                else
                    options[0].attr('selected', true);
                return options;
            });
    };

    annoAPP.checkGroupExceptions = function () {
        var self = this, result;
        annoCgscript(this.appBackend)
            .run([this.siteName, this.parentAppName, '\\check_group_exceptions'], undefined, { async: false })
            .done(function (r) {
                result = JSON.parse(r);
            })
            .fail(function (t, msg, err) {
                alert(msg + (err.Result || err));
                if (t === 0)
                    result = new Error();
                self.closeAllWaitingBoxes();
            });
        return result;
    };

    annoAPP.getAnnoSetHomesList = function () {
        var self = this, result;
        annoCgscript(this.appBackend)
            .run([this.siteName, this.parentAppName, '\\get_annotation_set_homes_list'], undefined, { async: false })
            .done(function (r) {
                result = JSON.parse(r);
            })
            .fail(function (t, msg, err) {
                alert(msg + (err.Result || err));
                if (t === 0)
                    result = new Error();
                self.closeAllWaitingBoxes();
            });
        return result;
    };

    annoAPP.getAnnoSetsList = function (paras /* object type - optional - structure:  { "by": homerid/name,  "para": numberType/stringType } */) {
        var self = this, result;
        annoCgscript(this.appBackend)
            .run([this.siteName, this.parentAppName, '\\get_annotation_sets_list', JSON.stringify(paras)], undefined, { async: false })
            .done(function (r) {
                result = JSON.parse(r);
            })
            .fail(function (t, msg, err) {
                alert(msg + (err.Result || err));
                if (t === 0)
                    result = new Error();
                self.closeAllWaitingBoxes();
            });
        return result;
    };

    annoAPP.getAnnoSetItem = function (annoSetRid /* number type - optional */) {
        var self = this, result;
        annoCgscript(this.appBackend)
            .run(annoSetRid === undefined ?
                    [this.siteName, this.parentAppName, '\\get_annotation_set'] :
                    [this.siteName, this.parentAppName, '\\get_annotation_set', Number(annoSetRid)], undefined, { async: false }
            )
            .done(function (r) {
                result = JSON.parse(r);
            })
            .fail(function (t, msg, err) {
                alert(msg + (err.Result || err));
                if (t === 0)
                    result = new Error();
                self.closeAllWaitingBoxes();
            });
        return result;
    };

    annoAPP.getAnnoSetName = function (annoSetRid) {
        var self = this, result;
        annoCgscript(this.appBackend)
            .run([this.siteName, this.parentAppName, '\\get_annotation_set_name', Number(annoSetRid)], undefined, { async: false })
            .done(function (r) {
                result = r;
            })
            .fail(function (t, msg, err) {
                alert(msg + (err.Result || err));
                if (t === 0)
                    result = new Error();
                self.closeAllWaitingBoxes();
            });
        return result;
    };

    annoAPP.createAnnoSetItem = function (annoSetItem) {
        var self = this, result;
        annoCgscript(this.appBackend)
            .run([this.siteName, this.parentAppName, '\\create_annotation_set', JSON.stringify(annoSetItem)], undefined, { async: false })
            .done(function (r) {
                result = JSON.parse(r);
            })
            .fail(function (t, msg, err) {
                if (t === 0) {  // CGScript failed level
                    if (err.Result && err.Result.indexOf('with the same name as') !== -1)
                        alert('Brug venligst en anden annotation sæt navn. Dette navn findes allerede.');
                    else
                        alert(msg + (err.Result || err));
                    result = new Error();
                }
                else
                    alert(msg + (err.Result || err));
                self.closeAllWaitingBoxes();
            });
        return result;
    };

    annoAPP.updateAnnoSetItem = function (annoSetItem) {
        var self = this, result;
        annoCgscript(this.appBackend)
            .run([this.siteName, this.parentAppName, '\\update_annotation_set', JSON.stringify(annoSetItem)], undefined, { async: false })
            .done(function (r) {
                result = JSON.parse(r);
            })
            .fail(function (t, msg, err) {
                if (t === 0) {  // CGScript failed level
                    if (err.Result && err.Result.indexOf('with the same name as') !== -1)
                        alert('Brug venligst en anden annotation sæt navn. Dette navn findes allerede.');
                    else
                        alert(msg + (err.Result || err));
                    result = new Error();
                }
                else
                    alert(msg + (err.Result || err));
                self.closeAllWaitingBoxes();
            });
        return result;
    };

    annoAPP.deleteAnnoSetItem = function (annoSetRid) {
        var self = this, result;
        annoCgscript(this.appBackend)
            .run([this.siteName, this.parentAppName, '\\delete_annotation_set', Number(annoSetRid)], undefined, { async: false })
            .done(function (r) {
                result = JSON.parse(r);
            })
            .fail(function (t, msg, err) {
                alert(msg + (err.Result || err));
                if (t === 0)
                    result = new Error();
                self.closeAllWaitingBoxes();
            });
        return result;
    };

    annoAPP.getAnnoSetDisplayOrder = function (annoSetRid) {
        var self = this, result;
        annoCgscript(this.appBackend)
            .run([this.siteName, this.parentAppName, '\\get_annotation_set_display_order'], undefined, { async: false })
            .done(function (r) {
                result = r;
            })
            .fail(function (t, msg, err) {
                alert(msg + (err.Result || err));
                if (t === 0)
                    result = new Error();
                self.closeAllWaitingBoxes();
            });
        return result;
    };

    annoAPP.setAnnoSetDisplayOrder = function (annoSetRid, displayOrder) {
        var self = this, result;
        return annoCgscript(this.appBackend)
            .run([this.siteName, this.parentAppName, '\\save_annotation_set_display_order', JSON.stringify({ annotationSetRid: annoSetRid, annotationSetDisplayOrder: displayOrder })])
            .done(function (r) {})
            .fail(function (t, msg, err) {
                alert(msg + (err.Result || err));
                if (t === 0)
                    result = new Error();
                self.closeAllWaitingBoxes();
            });
    };

    annoAPP.getDataForSelectionDialog = function () {
       var self = this, result;
       return annoCgscript(this.appBackend)
            .run([this.siteName, this.parentAppName, '\\get_all_annotation_sets_of_user'])
            .done(function (r) {})
            .fail(function (t, msg, err) {
                alert(msg + (err.Result || err));
                self.closeAllWaitingBoxes();
            });
    };
    
    return annoAPP;
});
define('annojs/displayOrderWidget',['annojs/app', 'annoCgscript'], function (app, annoCgscript) {

    return function (itemRid, displayOrder, isEditable, isHidden) {
        var cssClass, cssPrefix, resourceTxts, widgetLayout, editDialogLayout, $widget, $editDialogWidget, $displayOrderSpan, $displayOrderInput, $editDialogSaveButton;
        cssPrefix = 'displayOrderWidget-';
        cssClass = {
            container: cssPrefix + 'container',
            label: cssPrefix + 'label',
            value: cssPrefix + 'value',
            editableButton: cssPrefix + 'editableButton',
            editDialogContainer: cssPrefix + 'editDialogContainer',
            editDialogLabel: cssPrefix + 'editDialogLabel',
            editDialogInput: cssPrefix + 'editDialogInput',
            editDialogSaveButton: cssPrefix + 'editDialogSaveButton'
        };

        resourceTxts = {
            label: 'Display orden:',
            notDefinedDisplayOrder: 'ikke defineret',
            editableButton: 'Edit',
            save: 'Gem',
            saving: 'Gem...',
            close: 'Luk'
        };

        // The widget layout
        widgetLayout = '<div class="' + cssClass.container + '">';
        widgetLayout += '<span class="' + cssClass.label + '">' + resourceTxts.label + '</span>';
        widgetLayout += '<span class="' + cssClass.value + '"></span>';
        if (isEditable) widgetLayout += '<span class="glyphicon glyphicon-pencil ' + cssClass.editableButton + '" title="' + resourceTxts.editableButton + '"></span>';
        widgetLayout += '</div>';

        // The edit dialog widget layout
        editDialogLayout = '<div class="' + cssClass.editDialogContainer + '">';
        editDialogLayout += '<span class="' + cssClass.editDialogLabel + '">' + resourceTxts.label + '</span>';
        editDialogLayout += '<input type="text" class="form-control ' + cssClass.editDialogInput + '"/>';
        editDialogLayout += '<button class="btn btn-default ' + cssClass.editDialogSaveButton + '"></button>';
        editDialogLayout += '<button class="btn btn-default ' + cssClass.editDialogCloseButton + '"></button>';
        editDialogLayout += '</div>';
        
        displayOrder = (displayOrder === undefined || displayOrder === '') ? null : displayOrder;
        // Generate the widget
        $widget = $(widgetLayout);
        isHidden ? $widget.hide() : null;
        $displayOrderSpan = $widget.find('span.' + cssClass.value).text(displayOrder !== null ? displayOrder : resourceTxts.notDefinedDisplayOrder);
        $widget.click(function (e) {
            e.stopImmediatePropagation();
            if (!isEditable) return;

            // Generate the edit dialog widget
            $editDialogWidget = $(editDialogLayout);
            $displayOrderInput = $editDialogWidget.find('input.' + cssClass.editDialogInput).val(displayOrder != undefined ? displayOrder : '');
            $editDialogSaveButton = $editDialogWidget.find('button.' + cssClass.editDialogSaveButton)
                .text(resourceTxts.save)
                .click(function (e) {
                    var isValid = false, val, waitingBox;
                    val = $.trim($displayOrderInput.val());
                    if (val === '') {
                        isValid = true;
                        displayOrder = null;
                    }
                    else if (app.isPositiveInteger(val)) {
                        isValid = true;
                        displayOrder = Number(val);
                    }
                    if (isValid) {
                        waitingBox = app.showWaitingBox(resourceTxts.saving);
                        app.setAnnoSetDisplayOrder(itemRid, displayOrder)
                            .done(function (r) {
                                app.closeWaitingBox(waitingBox);
                            })
                            .fail(function (t, msg, err) {
                                app.closeWaitingBox(waitingBox);
                            });
                    }
                    else {
                        app.dialogBox('Displayet ordre skal være positivt heltal.', {
                            modal: true,
                            buttons: {
                                'Luk': function (e) {
                                    $(this).dialog('close');
                                }
                            }
                        });
                    }
                });
            $editDialogCloseButton = $editDialogWidget.find('button.' + cssClass.editDialogCloseButton).text(resourceTxts.close);

            app.dialogBox($editDialogWidget, {
                modal: true,
                width: 400,
                open: function () {
                    var self = this;
                    $editDialogCloseButton.click(function (e) {
                        if (displayOrder === null)
                            $displayOrderSpan.text(resourceTxts.notDefinedDisplayOrder);
                        else
                            $displayOrderSpan.text(displayOrder);
                        $(self).dialog('destroy').remove();
                    });
                }
            });
        });

        return $widget;
    };
});
define('annojs/item',['annojs/app', 'annojs/displayOrderWidget', 'annoCgscript'], function (app, displayOrderWidget, annoCgscript) {

    ////////////////////////
    // view class
    ////////////////////////        
    var view = function (_appInstance, _viewLocation, _viewCssId) {
        var _controller,
            _viewContainerStr = '#' + _viewCssId;

        var _AnnoSetItemMainContainerClass = 'itemModule_AnnoSetItemMainContainer',
            _AnnoSetRidContainerClass = 'itemModule_AnnotationSetRidContainer',
            _AnnoSetRidClass = 'itemModule_AnnotationSetRid',
            _AnnoSetDisplayOrderContainerClass = 'itemModule_AnnotationSetDisplayOrderContainer',
            _AnnoSetDisplayOrderClass = 'itemModule_AnnotationSetDisplayOrder',
            _AnnoSetNameContainerClass = 'itemModule_AnnotationSetNameContainer',
            _AnnoSetNameClass = 'itemModule_AnnotationSetName',
            _OrganizationAssignmentContainerClass = 'itemModule_OrganizationAssignmentContainer',
            _OrganizationAssignmentButtonClass = 'itemModule_OrganizationAssignmentButton',
			_OrganizationAssignmentQuickButtonClass = 'itemModule_OrganizationAssignmentQuickButton',
            _OrganizationsTableContainerClass = 'itemModule_OrganizationsTableContainer',
            _OrganizationsTableClass = 'itemModule_OrganizationsTable',
            _OrganizationRowClass = 'itemModule_OrganizationRow',
            _OrganizationRowHoverClass = 'itemModule_OrganizationRowHover',
            _OrganizationOrderColumnClass = 'itemModule_OrganizationOrderColumn',
            _OrganizationNameColumnClass = 'itemModule_OrganizationNameColumn',
            _OrganizationReadColumnClass = 'itemModule_OrganizationReadColumn',
            _OrganizationEditableColumnClass = 'itemModule_OrganizationEditableColumn',
            _SettingsContainerClass = 'itemModule_SettingsContainer',
            _AnnoNameClass = 'itemModule_AnnotationItemName',
            _AnnoStyleClass = 'itemModule_AnnotationItemStyle',
            _StartDateClass = 'itemModule_AnnotationItemStartDate',
            _EndDateClass = 'itemModule_AnnotationItemEndDate',
            _HomesSelectionContainerClass = 'itemModule_HomesSelectionContainer',
            _HomesSelectionLabelClass = 'itemModule_HomesSelectionLabel'
            _HomesSelectionClass = 'itemModule_HomesSelection',
            _ButtonsContainerClass = 'itemModule_ButtonsContainer',
            _DeleteButtonClass = 'itemModule_DeleteButton',
            _SaveButtonClass = 'itemModule_SaveButton',
            _CloseButtonClass = 'itemModule_CloseButton',
            _AnnotationBoard_buttons_MouseOver = 'annotationBoard_Buttons_MouseOver',
            _HideElementClass = 'hideElement';

        this.setController = function (c) { _controller = c; };

        this.getViewLocation = function () { return _viewLocation; };

        this.getViewCssId = function () { return _viewCssId; };

        this.removeViewContainer = function () { $(_viewContainerStr).remove(); };

        this.render = function (annoSetRid, afterDeleteCloseHandler) {
            var waitingBox = app.showWaitingBox(app.resourceTxts.loading);		// Show the waiting box	
            var self = this;
            var viewData = app.getAnnoSetItem(annoSetRid);		// Get the annotation set item

            var annotationSetRid = viewData['annotationSetRid'], 	// annotationSetRid will be undefined or annotationSetRid
                isAdmin = viewData['isAdmin'],
                nonAdminHomes = viewData['nonAdminHomes'],
                adminHome = viewData['adminHome'],
                userHomes = viewData['userHomes'],
                annotationStylesList = viewData['annotationStyleList'],
                annotationSetDisplayOrder, annotationSetName, annotationSetHomeRid, annotationSettings, annotationSetItems, annotationSetAccessibleByHomes, fullControl;

            if (annotationSetRid) {
                annotationSetDisplayOrder = viewData['annotationSetDisplayOrder'];
                annotationSetName = viewData['annotationSetName'];
                annotationSetHomeRid = viewData['annotationSetHomeRid'];
                annotationSettings = viewData['annotationSettings'];
                annotationSetItems = annotationSettings['items'];
                annotationSetAccessibleByHomes = viewData['accessibleByHomes'];
                fullControl = viewData['fullControl'];
            }

            // Create the View container element
            var viewContainer = $('<div>', { 'id': _viewCssId, 'class': _AnnoSetItemMainContainerClass }).appendTo('#' + this.getViewLocation());

            // Create the annotation set rid element
            var annotationSetRidContainer = $('<div>', { 'class': _AnnoSetRidContainerClass }).hide().appendTo(viewContainer);
            $('<span>Annotation set Rid: </span>').appendTo(annotationSetRidContainer);
            var annotationSetRidElement = $('<span class="' + _AnnoSetRidClass + '">' + (annotationSetRid ? annotationSetRid : 0) + '</span>').appendTo(annotationSetRidContainer);

            // Create the annotation set display order element
            var annotationSetDisplayOrderContainer = $('<div>', { 'class': _AnnoSetDisplayOrderContainerClass }).appendTo(viewContainer);
            _appInstance.hideItemOrder ? annotationSetDisplayOrderContainer.hide() : null;
            $('<span>Display orden: </span>').appendTo(annotationSetDisplayOrderContainer);
            var oldVal = '';
            var annotationSetDisplayOrderElement = $('<input type="text" class="' + _AnnoSetDisplayOrderClass + '" value="' + (annotationSetDisplayOrder != undefined ? annotationSetDisplayOrder : '') + '"/>')
                    .click(function (e) {
                        oldVal = $(this).val();
                    })
                    .keyup(function (e) {
                        var currentTarget = this;
                        var val = $(this).val();
                        if (val != '' && app.isPositiveInteger(val) === false)
                            app.dialogBox('Displayet ordre skal være positivt heltal.', {
                                modal: true,
                                buttons: {
                                    'Luk': function () {
                                        $(this).dialog('close');
                                        $(currentTarget).val(oldVal);
                                    }
                                }
                            });
                    })
                    .appendTo(annotationSetDisplayOrderContainer);

            // Create the annotation set name element
            var annotationSetNameContainer = $('<div>', { 'class': _AnnoSetNameContainerClass }).appendTo(viewContainer);
            $('<span>Annotation sæt navn: </span>').appendTo(annotationSetNameContainer);
            var annotationSetNameElement = $('<input type="text" class="' + _AnnoSetNameClass + '" value="' + (annotationSetName ? annotationSetName : '') + '"/>').appendTo(annotationSetNameContainer);

            // Create the annotation set organization assignment element	
            if (isAdmin) {
                var OrganizationAssignmentContainer = $('<div>', { 'class': _OrganizationAssignmentContainerClass }).appendTo(viewContainer);
                $('<span>Giv adgang til brugergrupper: </span>').appendTo(OrganizationAssignmentContainer);
                $('<span>', { 'class': _OrganizationAssignmentButtonClass, 'text': 'Vis liste' })
                    .hover(function (e) { $(this).toggleClass(_AnnotationBoard_buttons_MouseOver);})
                    .click(function (e) {
                        organizationsTableContainer.toggleClass(_HideElementClass);
                        if (organizationsTableContainer.hasClass(_HideElementClass))
                            $(this).text('Vis liste');
                        else
                            $(this).text('Skjule liste');
                    })
                    .appendTo(OrganizationAssignmentContainer);
                $('<span>', { 'text': 'Sæt alle læsbar' })
                    .addClass(_OrganizationAssignmentQuickButtonClass)                    
                    .click(function (e) {
                        $('table.' + _OrganizationsTableClass).find('input:checkbox[value="1"]').attr('checked', true);
                    })
                    .appendTo(OrganizationAssignmentContainer);
                $('<span>', { 'text': 'Fravælg alle læsbar' })
                    .addClass(_OrganizationAssignmentQuickButtonClass)
                    .click(function (e) {
                        $('table.' + _OrganizationsTableClass).find('input:checkbox[value="1"]').attr('checked', false);
                    })
                    .appendTo(OrganizationAssignmentContainer);
                $('<span>', { 'text': 'Sæt alle skrivbar' })
                    .addClass(_OrganizationAssignmentQuickButtonClass)
                    .click(function (e) {
                        $('table.' + _OrganizationsTableClass).find('input:checkbox[value="2"]').attr('checked', true);
                    })
                    .appendTo(OrganizationAssignmentContainer);
                $('<span>', { 'text': 'Fravælg alle skrivbar' })
                    .addClass(_OrganizationAssignmentQuickButtonClass)
                    .click(function (e) {
                        $('table.' + _OrganizationsTableClass).find('input:checkbox[value="2"]').attr('checked', false);
                    })
                    .appendTo(OrganizationAssignmentContainer);
                var organizationsTableContainer = $('<div>', { 'class': _OrganizationsTableContainerClass }).addClass(_HideElementClass).appendTo(OrganizationAssignmentContainer);                
                var organizationsTable = $('<table>', {
                    'class': _OrganizationsTableClass,
                    'cellpadding': 0,
                    'cellspacing': 0,
                    'border': 0
                }).appendTo(organizationsTableContainer);

                nonAdminHomes = app.sortByName(nonAdminHomes, 1, 'asc');
                $.each(nonAdminHomes, function (i, arr) {
                    var homeRid = arr[0],
                        homeName = arr[1];
                    if (homeRid != annotationSetHomeRid) {
                        var tr = $('<tr>', { 'class': _OrganizationRowClass }).hover(function () { $(this).toggleClass(_OrganizationRowHoverClass); }).appendTo(organizationsTable);	// Create a table row
                        $('<td>', { 'class': _OrganizationNameColumnClass, 'text': homeName }).appendTo(tr);	    // Create Home Name Column
                        var readOnlyCheckBox = $('<input type="checkbox" name="' + homeRid + '" value="1"/>');		// Create Read Only Checkbox
                        var editableCheckBox = $('<input type="checkbox" name="' + homeRid + '" value="2"/>');		// Create Editable Checkbox
                        $('<td>', { 'class': _OrganizationReadColumnClass }).append(readOnlyCheckBox, $('<span>Læsbar</span>')).appendTo(tr);			// Create Read Only Column			
                        $('<td>', { 'class': _OrganizationEditableColumnClass }).append(editableCheckBox, $('<span>Skrivbar</span>')).appendTo(tr);		// Create Editable Column
                        readOnlyCheckBox.click(function (e) { editableCheckBox.attr('checked', false); });
                        editableCheckBox.click(function (e) { readOnlyCheckBox.attr('checked', false); });
                    }
                });
                if (annotationSetAccessibleByHomes)
                    $.each(annotationSetAccessibleByHomes, function (i, arr) {
                        var homeRid = arr[0],
                            permission = arr[1];
                        $(organizationsTable).find('input[name="' + homeRid + '"][value="' + permission + '"]').attr('checked', true);
                    });
            }

            // Create the annotation item elements
            var annotationSetItemsContainer = $('<ul>', { 'class': _SettingsContainerClass }).appendTo(viewContainer);
            if (annotationSetRid === undefined)
                this.addSettingRow('append', annotationSetItemsContainer, annotationStylesList);
            else
                $.each(annotationSetItems, function (i, items) {
                    self.addSettingRow('append', annotationSetItemsContainer, annotationStylesList, items);
                });

            // Create the annotation set homes selection elements
            var homesSelectionContainer = $('<div>', { 'class': _HomesSelectionContainerClass }).appendTo(viewContainer);
            $('<span>', {'class': _HomesSelectionLabelClass + ' label label-default'}).text('Annotation sæt placering:').appendTo(homesSelectionContainer);
            var homesSelectionElement = $('<select>', { 'class': _HomesSelectionClass }).appendTo(homesSelectionContainer);
            var defaultOptionElement = $('<option>').attr('value', 'default').text(app.resourceTxts.select).appendTo(homesSelectionElement);
            var homesSelectionArray = [];
            var isThisAnnoSetBelongToUserHomes = false;
            if (isAdmin) {
                homesSelectionArray = jQuery.extend([], nonAdminHomes);
                homesSelectionArray.insert(0, adminHome);
                isThisAnnoSetBelongToUserHomes = true;
            }
            else {
                userHomes = app.sortByName(userHomes, 1, 'asc');
                homesSelectionArray = userHomes;
                $.each(homesSelectionArray, function (i, arr) {
                    var homeRid = arr[0];
                    if (annotationSetHomeRid === Number(homeRid))
                        isThisAnnoSetBelongToUserHomes = true;
                });
            }
            $.each(homesSelectionArray, function (i, arr) {
                var homeRid = arr[0], homeName = arr[1];
                var option = $('<option>').attr('value', homeRid).text(homeName).appendTo(homesSelectionElement);
                if (annotationSetHomeRid === Number(homeRid))
                    option.attr('selected', true);
            });

            if (annotationSetRid) {
                if (isThisAnnoSetBelongToUserHomes && homesSelectionArray.length === 1)
                    homesSelectionContainer.hide();

                if (!isThisAnnoSetBelongToUserHomes) {
                    var otherHomeName = '';
                    $.each(nonAdminHomes, function (i, arr) {
                        var homeRid = arr[0], homeName = arr[1];
                        if (annotationSetHomeRid === Number(homeRid)) {
                            otherHomeName = homeName;
                            return false; // break this loop
                        }
                    });
                    if (otherHomeName === '' && annotationSetHomeRid === adminHome[0])
                        otherHomeName = adminHome[1];

                    $('<option>').attr({ 'value': annotationSetHomeRid, 'selected': true }).text(otherHomeName).appendTo(homesSelectionElement);
                }
            }
            else
                if (homesSelectionArray.length === 1) {
                    homesSelectionElement.find('option[value!=default]').attr('selected', true);
                    homesSelectionContainer.hide();
                }

            // Create the buttons elements
            var buttonsContainer = $('<div>', { 'class': _ButtonsContainerClass })
                .append(function () {
                    if (fullControl === undefined || fullControl)
                        return $('<span>', {
                            'class': _SaveButtonClass + ' glyphicon glyphicon-floppy-save',
                            title: app.resourceTxts.save,
                            click: function () {
                                var annoSetRid = Number(annotationSetRidElement.text());
                                var annoSetName = annotationSetNameElement.val();
                                var annoSetHome = Number(homesSelectionElement.val());
                                var annoSetDisplayOrder = annotationSetDisplayOrderElement.val();
                                annoSetDisplayOrder = annoSetDisplayOrder != '' ? Number(annoSetDisplayOrder) : null;
                                if (typeof organizationsTable === 'undefined')
                                    var accessibleByHomes = null;
                                else {
                                    var accessibleByHomes = [];
                                    organizationsTable.find('input:checked').each(function (i, inputElement) {
                                        var homeRid = Number($(inputElement).attr('name'));
                                        var permission = Number($(inputElement).val());
                                        accessibleByHomes.push([homeRid, permission]);
                                    });
                                }

                                var annoSetItemRows = annotationSetItemsContainer.find('li');
                                var annoSetItems = {};
                                annoSetItemRows.each(function (i, row) {
                                    annoSetItems[i] = {};
                                    annoSetItems[i]['annotationName'] = $(row).children('.' + _AnnoNameClass).val();
                                    annoSetItems[i]['annotationStyleValue'] = Number($(row).children('.' + _AnnoStyleClass).val());
                                    annoSetItems[i]['start'] = $(row).children('.' + _StartDateClass).val();
                                    annoSetItems[i]['end'] = $(row).children('.' + _EndDateClass).val();
                                });
                                var annoSettings = { items: annoSetItems };

                                _controller.saveAnno({
                                    'annotationSetItem': {
                                        annotationSetRid: annoSetRid,
                                        annotationSetName: annoSetName,
                                        annotationSetHome: annoSetHome,
                                        annotationSettings: annoSettings,
                                        annotationSetDisplayOrder: annoSetDisplayOrder,
                                        accessibleByHomes: accessibleByHomes
                                    },
                                    'annotationItem_StartDate_Class': _StartDateClass,
                                    'annotationItem_EndDate_Class': _EndDateClass,
                                    'afterDeleteCloseHandler': afterDeleteCloseHandler
                                });
                            },
                            hover: function () { $(this).toggleClass(_AnnotationBoard_buttons_MouseOver); }
                        });
                })
                .append($('<span>', {
                    'class': _CloseButtonClass + ' glyphicon glyphicon-log-out',
                    title: app.resourceTxts.close,
                    click: function () {
                        var annoSetRid = Number(annotationSetRidElement.text());
                        var annoSetName = '';
                        if (annoSetRid !== 0)
                            annoSetName = app.getAnnoSetName(annoSetRid);
                        _controller.closeAnno(annoSetName, afterDeleteCloseHandler);
                    },
                    hover: function () { $(this).toggleClass(_AnnotationBoard_buttons_MouseOver); }
                })
                )
                .appendTo(viewContainer);

            if (annotationSetRid) // Add Delete button if the annotationSetRid exists
                this.addDeleteButton(annotationSetRid, afterDeleteCloseHandler);

            app.closeWaitingBox(waitingBox);		// Close the waiting box
        };

        this.addSettingRow = function (position, eventTarget, annoStylesList, settingRowValue) {
            var self = this;
            var annotationName = settingRowValue ? settingRowValue['annotationName'] : '',
                annotationStyleValue = settingRowValue ? settingRowValue['annotationStyleValue'] : undefined,
                annotationStartDate = settingRowValue ? settingRowValue['start'] : '',
                annotationEndDate = settingRowValue ? settingRowValue['end'] : '';

            var dprOpt = {
                dateFormat: 'M d yy',
                showWeek: true,
                numberOfMonths: 3,
                changeMonth: true,
                yearRange: 'c-15:c+15',
                changeYear: true
            };

            var annoStylesListElement = $('<select>', { 'class': _AnnoStyleClass })
                    .append(function () {
                        var options = $();
                        $.each(annoStylesList, function (i, annoStyleName) {
                            options = options.add($('<option>').attr('value', i).text(annoStyleName));
                        });
                        if (annotationStyleValue)
                            $(options[annotationStyleValue]).attr('selected', true);
                        else
                            $(options[0]).attr('selected', true);
                        return options;
                    });
            
            var li = $('<li>')
                        .append(
                            '<span>Navn </span>',
                            $('<input type="text"/>').addClass(_AnnoNameClass)
                                .attr('title', annotationName)
                                .val(annotationName)
                                .mouseout(function (e) { $(this).attr('title', $(this).val()); })
                        )
                        .append('<span>Style </span>', annoStylesListElement)
                        .append(
                            '<span>Startdato </span>',
                            $('<input type="text"/>')
                                .addClass(_StartDateClass)
                                .attr('readonly', true)
                                .datepicker(dprOpt)
                                .val($.datepicker.formatDate('M d yy', $.datepicker.parseDate('@', annotationStartDate)))
                        )
                        .append(
                            '<span>Slutdato </span>',
                            $('<input type="text"/>')
                                .addClass(_EndDateClass)
                                .attr('readonly', true)
                                .datepicker(dprOpt)
                                .val($.datepicker.formatDate('M d yy', $.datepicker.parseDate('@', annotationEndDate)))
                        )
                        .append($('<span>', {
                            'class': app.cssClass.moveUpButtonIcon,
                            alt: 'move up',
                            title: 'Move Up',
                            click: function () {
                                var parent = $(this).parent();                                    
                                parent.prev().before(parent);
                            }
                        })
                        )
                        .append($('<span>', {
                            'class': app.cssClass.moveDownButtonIcon,
                            alt: 'move down',
                            title: 'Move Down',
                            click: function () {
                                var parent = $(this).parent();
                                parent.next().after(parent);
                            }
                        })
                        )
                        .append($('<span>', {
                            'class': app.cssClass.addButtonIcon,
                            alt: 'add',
                            title: 'Add',
                            click: function () {
                                var parent = $(this).parent();
                                self.addSettingRow('after', parent, annoStylesList);
                            }
                        })
                        )
                        .append($('<span>', {
                            'class': app.cssClass.removeButtonIcon,
                            alt: 'remove',
                            title: 'Remove',
                            click: function () {
                                var parent = $(this).parent();
                                var parentSiblings = parent.siblings().length;
                                if (parentSiblings === 0)
                                    self.addSettingRow('after', parent, annoStylesList);
                                parent.remove();
                            }
                        })
                        );

            // Add the setting row  
            if (position === 'after')
                $(eventTarget).after(li);
            else if (position === 'before')
                $(eventTarget).before(li);
            else if (position === 'append')
                $(eventTarget).append(li);
            else if (position === 'prepend')
                $(eventTarget).prepend(li);
        };

        this.setAnnoSetRid = function (annoSetRid) {
            $(_viewContainerStr + ' .' + _AnnoSetRidClass).text(annoSetRid);
        };

        this.addDeleteButton = function (annoSetRid, afterDeleteCloseHandler) {
            var self = this;
            $(_viewContainerStr + ' .' + _DeleteButtonClass).remove();
            $(_viewContainerStr + ' .' + _SaveButtonClass).after(function () {
                if (annoSetRid) {
                    return $('<span>', {
                        'class': _DeleteButtonClass + ' glyphicon glyphicon-trash',
                        title: app.resourceTxts["delete"],
                        click: function () {
                            var controller = _controller;
                            app.dialogBox('Er du sikker på du vil slette denne post?', {
                                width: '450px',
                                modal: true,
                                buttons: [
                                    {
                                        text: app.resourceTxts.yes,
                                        click: function (e) {
                                            controller.deleteAnno(annoSetRid, afterDeleteCloseHandler);
                                            $(this).dialog('destroy');
                                        }
                                    },
                                    { text: app.resourceTxts.no, click: function (e) { $(this).dialog('destroy'); } }
                                ]
                            });
                        },
                        hover: function () { $(this).toggleClass(_AnnotationBoard_buttons_MouseOver); }
                    });
                }
            });
        };
    };

    //////////////////////
    // controller class
    //////////////////////
    var controller = function (_appInstance) {
        var _view;

        this.setView = function (v) { _view = v; };

        this.saveAnno = function (paraObj) {
            var self = this;

            app.dialogBox(app.resourceTxts.saving, {
                modal: true,
                open: function () {

                    var annoSetItem = paraObj['annotationSetItem'],
                        rid = annoSetItem['annotationSetRid'],
                        name = annoSetItem['annotationSetName'],
                        items = annoSetItem['annotationSettings']['items'],
                        accessibleByHomes = annoSetItem['annotationSettings']['accessibleByHomes'],
                        failedMsg = '', annoSetRid;

                    if (name === '') {
                        failedMsg = 'Please input the annotation set name!';
                        $(this).text(failedMsg);
                        $(this).dialog('option', 'buttons', { 'Luk': function () { $(this).dialog('close'); } });
                        return;
                    }

                    $.each(items, function (i, settingInfo) {
                        var start = $('.' + paraObj['annotationItem_StartDate_Class']).eq(i).datepicker("getDate"),
                            end = $('.' + paraObj['annotationItem_EndDate_Class']).eq(i).datepicker("getDate");
                        start = $.datepicker.formatDate('@', start);
                        end = $.datepicker.formatDate('@', end);
                        if ($.trim(settingInfo['annotationName']) === '')
                            failedMsg = 'Angiv venligst elementet navn!'; /*'Please specify the annotation item name!';*/
                        else if (start === '' || end === '')
                            failedMsg = 'Skriv venligst startdato eller slutdato af elementet'; /*'Please input the start date or end date of the annotation items!';*/
                        else if (start > end)
                            failedMsg = 'Slutdatoen kan ikke være mindre end startdatoen!'; /*'The end date can not < than the start date!'*/;
                            
                        if (failedMsg !== '')
                            return false;  // Break the loop	

                        settingInfo['start'] = start;
                        settingInfo['end'] = end;
                    });
                    if (failedMsg !== '') {
                        $(this).text(failedMsg);
                        $(this).dialog('option', 'buttons', { 'Luk': function () { $(this).dialog('close'); } });
                        return;
                    }

                    if (rid === 0) // Create new annotation set action    
                        annoSetRid = Number(app.createAnnoSetItem(annoSetItem)); 		// return the new created annotation set rid
                    else // Update annotation set action    
                        annoSetRid = Number(app.updateAnnoSetItem(annoSetItem)); 	 	// return the updated annotation set rid

                    if (isNaN(annoSetRid)) {
                        annoSetRid = 0;
                        $(this).dialog('close');		// Close dialog box
                        return;
                    }

                    _view.setAnnoSetRid(annoSetRid);
                    _view.addDeleteButton(annoSetRid, paraObj['afterDeleteCloseHandler']);

                    $(this).text(app.resourceTxts.saved); 		// Show dialog box to inform SAVED
                    $(this).dialog('close');	// Close dialog box
                }
            });
        };

        this.deleteAnno = function (annoSetRid, afterDeleteHandler) {
            var self = this;
            app.dialogBox(app.resourceTxts.deleting, {
                modal: true,
                open: function () {
                    app.deleteAnnoSetItem(annoSetRid);		// Delete the annotation set item on server
                    $(this).dialog('close');
                }
            });
            _view.removeViewContainer();		// Remove the view of this module
            if (afterDeleteHandler)
                afterDeleteHandler('delete', annoSetRid);
        };

        this.closeAnno = function (annoSetName, afterCloseHandler) {
            _view.removeViewContainer();		// Remove the view of this module
            if (afterCloseHandler)
                afterCloseHandler('close', annoSetName);
        };
    };

    // Add module to app
    app['annoSetItemModule'] = {
        view: view,
        controller: controller
    };

    return {
        view: view,
        controller: controller
    };
});
define('annojs/itemsManagement',['annojs/app', 'annojs/displayOrderWidget', 'annoCgscript'], function (app, displayOrderWidget, annoCgscript) {

    //////////////////
    // view class
    //////////////////
    var view = function (_appInstance, _viewLocation, _viewCssId) {
        var _controller,
            _viewContainerStr = '#' + _viewCssId;

        var _AnnoSetsManagementMainContainer = 'manageModule_AnnoSetsManagementMainContainer',
            _TabsContainerClass = 'manageModule_TabsContainer',
            _TabClass = 'manageModule_Tab',
            _TabActiveClass = 'manageModule_ActiveTab',
            _TabMouseOverClass = 'manageModule_MouseOverTab',
            _ContentContainerClass = 'manageModule_ContentContainer',
            _AnnotationSetItemContainerClass = 'manageModule_AnnotationSetItemContainer',
            _AnnotationSetRidClass = 'manageModule_AnnotationSetRid',
            _AnnotationSetDisplayOrderClass = 'manageModule_AnnotationSetDisplayOrder',
            _AnnotationSetNameClass = 'manageModule_AnnotationSetName',
            _NoItemsFoundClass = 'noItemFound',
            _ButtonsContainerClass = 'manageModule_ButtonsContainer',
            _DeleteButtonClass = 'manageModule_DeleteButton glyphicon glyphicon-trash',
            _AnnotationBoard_buttons_MouseOver = 'annotationBoard_Buttons_MouseOver',
            _AnnotationBoard_AnnoSetItemRow_MouseOver = 'annotationBoard_AnnoSetItemRow_MouseOver';


        this.setController = function (c) { _controller = c; };

        this.getViewLocation = function () { return _viewLocation; };

        this.getViewCssId = function () { return _viewCssId; };

        this.hideViewContainer = function () { $(_viewContainerStr).hide(); };

        this.showViewContainer = function () { $(_viewContainerStr).show(); };

        this.render = function () {

            // Create the View container element
            var viewContainer = $('<div>', { 'id': _viewCssId, 'class': _AnnoSetsManagementMainContainer }).appendTo('#' + this.getViewLocation());

            // Create the Tabs container element
            var tabsContainer = $('<div>', { 'class': _TabsContainerClass }).appendTo(viewContainer);

            // Create the Annotation Sets Container element
            var contentContainer = $('<div>', { 'class': _ContentContainerClass }).appendTo(viewContainer);

            // Render the tabs list		
            this.renderTabs(undefined, contentContainer, tabsContainer);
        };

        this.renderTabs = function (tab /* home Rid: number type */, contentContainer, tabsContainer) {
            var waitingBox = app.showWaitingBox(app.resourceTxts.loading);		// Show the waiting box	

            var self = this;
            tabsContainer.html('');		// Empty the current content of the Tabs Container

            var viewData = app.getAnnoSetHomesList();		// Get the annotation set homes list
            if (viewData instanceof Error)
                return;
            if ($.isEmptyObject(viewData)) {
                app.closeWaitingBox(waitingBox);		// Close the waiting box
                contentContainer.html('<p class="' + _NoItemsFoundClass + '">Ingen emner fundet!</p>'  /*'No Items Found!'*/);
                return;
            }

            var annoSetHomesList = viewData['annotationSetHomes'],
                isAdmin = viewData['isAdmin'],
                adminHome = viewData['adminHome'],
                adminHomeRid = adminHome[0],
                adminHomeName = adminHome[1];

            var tabClickHandler = function (e) {
                var _tab = Number($(this).attr('tab'));
                $(this).siblings().removeClass(_TabActiveClass);
                $(this).addClass(_TabActiveClass);
                self.renderAnnoSets(_tab, contentContainer, tabsContainer);
            };

            var tabMouseOverHandler = function (e) {
                $(this).toggleClass(_TabMouseOverClass);
            };

            // Create the Tabs in the Tabs container element
            annoSetHomesList = app.sortByName(annoSetHomesList, 1, 'asc');
            $.each(annoSetHomesList, function (i, arr) {
                var homeRid = arr[0], homeName = arr[1];
                $('<span>', { 'class': _TabClass, 'text': homeName })
                    .attr({'tab': homeRid})
                    .click(tabClickHandler)
                    .hover(tabMouseOverHandler)
                    .appendTo(tabsContainer);  // Create the Home Tabs 		
            });

            var tabElement = tabsContainer.find('span[tab=' + tab + ']');
            app.closeWaitingBox(waitingBox);		// Close the waiting box
            if (tabElement.length === 0)
                return;
            else
                return tabElement;
        };

        this.renderAnnoSets = function (tab /* home Rid: number type */, contentContainer, tabsContainer) {
            var waitingBox = app.showWaitingBox(app.resourceTxts.loading);		// Show the waiting box	
            var self = this;
            contentContainer.html('');  	// Empty the current content of the Annotation Sets Container

            var viewData = app.getAnnoSetsList({ 'by': 'homerid', 'para': tab });   // Get the annotation set items list
            if (viewData instanceof Error)
                return;
            if ($.isEmptyObject(viewData)) {
                app.closeWaitingBox(waitingBox);		// Close the waiting box
                self.renderTabs(undefined, contentContainer, tabsContainer);
                contentContainer.html('<p class="' + _NoItemsFoundClass + '">Ingen emner fundet!</p>'  /*'No Items Found!'*/);
                return;
            }

            var annoSets = viewData['annotationSets'];
            var annoSetObjsArray = $.map(annoSets, function (value, key) {
                return value;
            });
            annoSetObjsArray = app.sortByName(annoSetObjsArray, 'annotationSetName', 'asc');

            var itemContainersList = $();

            // Start of the each loop
            $.each(annoSetObjsArray, function (i, annoSetObj) {
                var annoSetRid = annoSetObj['annotationSetRid'],
                    annoSetName = annoSetObj['annotationSetName'],
                    annoSetDisplayOrderVal = annoSetObj['annotationSetDisplayOrder'],
                    fullControl = annoSetObj['fullControl'];
                var itemContainer = $('<div>', { 'class': _AnnotationSetItemContainerClass, annotationSetRid: annoSetRid });
                var annoSetRidElement = $('<span>', { 'class': _AnnotationSetRidClass, 'text': annoSetRid });
                var annoSetNameElement = $('<p>', { 'class': _AnnotationSetNameClass, 'text': annoSetName });
                var annoSetDisplayOrderElement = displayOrderWidget(annoSetRid, annoSetDisplayOrderVal, fullControl, _appInstance.hideItemOrder);

                // Generate an annotation set item row
                itemContainer
                    .append(annoSetRidElement.hide())
                    .append(annoSetNameElement)
                    .append(annoSetDisplayOrderElement)
                    .append($('<p>', { 'class': _ButtonsContainerClass})                                
                                .append(function () {
                                    if (fullControl)
                                        return $('<span>', {
                                            'class': _DeleteButtonClass,                                            
                                            click: function (e) {
                                                // Delete an annotation set 
                                                e.stopImmediatePropagation();
                                                var afterDeleteSuccessHandler = function () {
                                                    itemContainer.remove();
                                                };

                                                var deleteFailedHandler = function () {
                                                    var tabElement = self.renderTabs(tab, contentContainer, tabsContainer);
                                                    if (tabElement) {
                                                        tabElement.addClass(_TabActiveClass);
                                                        self.renderAnnoSets(tab, contentContainer, tabsContainer);
                                                    }
                                                };

                                                var controller = _controller;
                                                app.dialogBox('Er du sikker på du vil slette denne post?', {
                                                    width: '450px',
                                                    modal: true,
                                                    buttons: [
                                                        {
                                                            text: app.resourceTxts.yes,
                                                            click: function (e) {
                                                                controller.deleteAnno(annoSetRid, afterDeleteSuccessHandler, deleteFailedHandler);
                                                                $(this).dialog('destroy');
                                                            }
                                                        },
                                                        { text: app.resourceTxts.no, click: function (e) { $(this).dialog('destroy'); } }
                                                    ]
                                                });
                                            },
                                            hover: function (e) { e.stopImmediatePropagation(); $(this).toggleClass(_AnnotationBoard_buttons_MouseOver); }
                                        });
                                })
                    )
                    .click(function (e) {
                        // Open an annotation set 
                        self.hideViewContainer();

                        var afterDeleteCloseHandler = function () {
                            self.showViewContainer();
                            contentContainer.html('');
                            var tabElement = self.renderTabs(tab, contentContainer, tabsContainer);
                            if (tabElement) {
                                tabElement.addClass(_TabActiveClass);
                                self.renderAnnoSets(tab, contentContainer, tabsContainer);
                            }
                        };
                        _controller.openAnno(annoSetRid, afterDeleteCloseHandler);
                    })
                    .hover(function (e) { $(this).toggleClass(_AnnotationBoard_AnnoSetItemRow_MouseOver); });

                // Add an annotation set item row to the list
                itemContainersList = itemContainersList.add(itemContainer);
            });
            // End of the each loop

            contentContainer.append(itemContainersList);
            app.closeWaitingBox(waitingBox);		// Close the waiting box
        };
    };

    ////////////////////////
    // controller class
    ////////////////////////
    var controller = function (_appInstance) {
        var _view;

        this.setView = function (v) { _view = v; };

        this.openAnno = function (annoSetRid, afterDeleteCloseHandler) {
            var waitingBox = app.showWaitingBox(app.resourceTxts.loading);		// Show the waiting box
            _appInstance.map['load VIEW of annoSetItemModule'].apply(_appInstance, [{
                    annotationSetRid: annoSetRid,
                    viewLocation: _view.getViewLocation(),
                    afterDeleteCloseHandler: afterDeleteCloseHandler
                }]
            ); 			// Call handler of map['load VIEW of annoSetItem Module'] event
            app.closeWaitingBox(waitingBox);		// Close the waiting box
        };

        this.deleteAnno = function (annoSetRid, afterDeleteSuccessHandler, deleteFailedHandler) {
            var waitingBox = app.showWaitingBox(app.resourceTxts.loading);		// Show the waiting box

            var result = app.deleteAnnoSetItem(annoSetRid);	// Delete the annotation set item on server					
            if (result instanceof Error)
                deleteFailedHandler();
            else
                afterDeleteSuccessHandler();
            app.closeWaitingBox(waitingBox);		// Close the waiting box				
        };
    };

    // Add module to app
    app['annoSetsManagementModule'] = {
        view: view,
        controller: controller
    };

    return {
        view: view,
        controller: controller
    };
});
define('annojs/itemsSearch',['annojs/app', 'annojs/displayOrderWidget', 'annoCgscript'], function (app, displayOrderWidget, annoCgscript) {

    ////////////////// 
    // view class
    //////////////////
    var view = function (_appInstance, _viewLocation, _viewCssId) {
        var _controller,
            _viewContainerStr = '#' + _viewCssId;

        var _AnnoSetsSearchContainer = 'searchModule_SearchContainer',
            _SearchBarContainerClass = 'searchModule_SearchBarContainer',
            _SearchResultContainerClass = 'searchModule_SearchResultContainer',
            _SearchTextBoxClass = 'searchModule_SearchTextBox',
            _NoItemsFoundClass = 'noItemFound',
            _SearchButtonClass = 'searchModule_SearchButton glyphicon glyphicon-search',
            _SearchTipClass = 'searchModule_SearchTip',
            _AnnotationSetItemContainerClass = 'searchModule_AnnotationSetItemContainer',
            _AnnotationSetRidClass = 'searchModule_AnnotationSetRid',
            _AnnotationSetNameClass = 'searchModule_AnnotationSetName',
            _ButtonsContainerClass = 'searchModule_ButtonsContainer',
            _AnnotationSetDisplayOrderClass = 'searchModule_AnnotationSetDisplayOrder',
            _DeleteButtonClass = 'searchModule_DeleteButton glyphicon glyphicon-trash',
            _AnnotationBoard_buttons_MouseOver = 'annotationBoard_Buttons_MouseOver',
            _AnnotationBoard_AnnoSetItemRow_MouseOver = 'annotationBoard_AnnoSetItemRow_MouseOver';

        this.setController = function (c) { _controller = c; };

        this.getViewLocation = function () { return _viewLocation; };

        this.getViewCssId = function () { return _viewCssId; };

        this.hideViewContainer = function () { $(_viewContainerStr).hide(); };

        this.showViewContainer = function () { $(_viewContainerStr).show(); };

        this.render = function () {
            var self = this;

            // Create the view container
            var viewContainer = $('<div>', { 'id': _viewCssId, 'class': _AnnoSetsSearchContainer }).appendTo('#' + this.getViewLocation());

            // Create the search bar container
            var searchBarContainer = $('<div>', { 'class': _SearchBarContainerClass }).appendTo(viewContainer);

            // Create the search bar elements
            var searchInformTxt = 'Skriv det anmærkning indstillede navn for at søge her ...';
            var searchTextBox = $('<input type="text"/>')
                .addClass(_SearchTextBoxClass + ' form-control')
                .click(function (e) { $(this).val(''); })
                .val(searchInformTxt)
                .appendTo(searchBarContainer);
            var searchButton = $('<span>', {
                'class': _SearchButtonClass,
                title: app.resourceTxts.search,
                hover: function (e) {
                    $(this).toggleClass(_AnnotationBoard_buttons_MouseOver);
                },
                click: function (e) {
                    var searchTxt = searchTextBox.val();
                    if (searchTxt === searchInformTxt)
                        searchTxt = '';
                    self.searchAndListAnnoSets(searchTxt); 		// Render the search results
                }
            }).appendTo(searchBarContainer);
            $('<p>', { 'class': _SearchTipClass })
                .append('<b>Tip</b>: Lad søgetekstboksen tom, eller forlade søgningen tekstfeltet med ovenstående standard søgeteksten og derefter klikke på søgeknappen for at få alle dine alarm emner.')
                .appendTo(searchBarContainer);

            // Create the search result Container
            var searchResultContainer = $('<div>', { 'class': _SearchResultContainerClass }).appendTo(viewContainer);
        };

        this.searchAndListAnnoSets = function (searchTxt) {
            var waitingBox = app.showWaitingBox(app.resourceTxts.loading);		// Show the waiting box	

            var self = this;
            var viewData = app.getAnnoSetsList({ by: 'name', para: searchTxt }); 	// Search the annotation sets by name 
            var searchResultContainer = $(_viewContainerStr + ' .' + _SearchResultContainerClass).html('');  	// Empty the current content of the search result container			
            if (viewData instanceof Error)
                return;
            if ($.isEmptyObject(viewData)) {
                app.closeWaitingBox(waitingBox);		// Close the waiting box
                searchResultContainer.html('<p class="' + _NoItemsFoundClass + '">Ingen varer fundet</p>');
                return;
            }

            var annotationSets = viewData['annotationSets'];

            var annoSetRidNamesArray = [];
            $.each(annotationSets, function (annoSetRid, annoSetObj) {
                annoSetRidNamesArray.push([Number(annoSetRid), annoSetObj['annotationSetName']]);
            });
            annoSetRidNamesArray = app.sortByName(annoSetRidNamesArray, 1, 'asc');	// Sort the home tabs by name

            var itemContainersList = $();

            // Start of the each loop
            $.each(annoSetRidNamesArray, function (i, arr) {
                var annoSetRid = arr[0],
                    annoSetName = arr[1],
                    annoSetObj = annotationSets[annoSetRid],
                    annoSetDisplayOrderVal = annoSetObj["annotationSetDisplayOrder"],
                    fullControl = annoSetObj['fullControl'];
                var itemContainer = $('<div>', { 'class': _AnnotationSetItemContainerClass, 'annotationSetRid': annoSetRid });
                var annoSetRidElement = $('<span>', { 'class': _AnnotationSetRidClass, 'text': annoSetRid });
                var annoSetNameElement = $('<p>', { 'class': _AnnotationSetNameClass, 'text': annoSetName });
                var annoSetDisplayOrderElement = displayOrderWidget(annoSetRid, annoSetDisplayOrderVal, fullControl, _appInstance.hideItemOrder);

                // Generate an annotation set item row 
                itemContainer
                    .append(annoSetRidElement.hide())
                    .append(annoSetNameElement)
                    .append(annoSetDisplayOrderElement)
                    .append(
                        $('<p>', { 'class': _ButtonsContainerClass })                            
                            .append(function () {
                                if (fullControl)
                                    return $('<span>', {
                                        'class': _DeleteButtonClass,
                                        title: app.resourceTxts["delete"],
                                        click: function (e) {
                                            // Delete an annotation set 
                                            e.stopImmediatePropagation();
                                            var afterDeleteSuccessHandler = function () {
                                                itemContainer.remove();
                                            };

                                            var deleteFailedHandler = function () {
                                                self.searchAndListAnnoSets(searchTxt);
                                            };

                                            var controller = _controller;
                                            app.dialogBox('Er du sikker på du vil slette denne post?', {
                                                width: '450px',
                                                modal: true,
                                                buttons: [
													{
													    text: app.resourceTxts.yes,
														click: function (e) {
														    controller.deleteAnno(annoSetRid, afterDeleteSuccessHandler, deleteFailedHandler);
														    $(this).dialog('destroy');
														}
													},
													{ text: app.resourceTxts.no, click: function (e) { $(this).dialog('destroy'); } }
                                                ]
                                            });
                                        },
                                        hover: function (e) { e.stopImmediatePropagation(); $(this).toggleClass(_AnnotationBoard_buttons_MouseOver); }
                                    });
                            })
                    )
                    .click(function (e) {
                        // Open an annotation set 
                        self.hideViewContainer();		// Hide the view of this module
                        searchResultContainer.html('');

                        var afterDeleteCloseHandler = function () {
                            self.showViewContainer();		// Show the view of this module
                            self.searchAndListAnnoSets(searchTxt);
                        };
                        _controller.openAnno(annoSetRid, afterDeleteCloseHandler);
                    })
                    .hover(function (e) { $(this).toggleClass(_AnnotationBoard_AnnoSetItemRow_MouseOver); });

                // Add an annotation set item row to the list
                itemContainersList = itemContainersList.add(itemContainer);
            });
            // End of the each loop

            searchResultContainer.append(itemContainersList);
            app.closeWaitingBox(waitingBox);		// Close the waiting box
        };
    };

    //////////////////////// 
    // controller class
    //////////////////////// 
    var controller = function (_appInstance) {
        var _view;

        this.setView = function (v) { _view = v; };

        this.openAnno = function (annoSetRid, afterDeleteCloseHandler) {
            var waitingBox = app.showWaitingBox(app.resourceTxts.loading);		// Show the waiting box
            _appInstance.map['load VIEW of annoSetItemModule'].apply(_appInstance, [{
                    annotationSetRid: annoSetRid,
                    viewLocation: _view.getViewLocation(),
                    afterDeleteCloseHandler: afterDeleteCloseHandler
                }]
            ); 	// Call handler of map['load VIEW of annoSetItem Module'] event   
            app.closeWaitingBox(waitingBox);		// Close the waiting box			
        };

        this.deleteAnno = function (annoSetRid, afterDeleteSuccessHandler, deleteFailedHandler) {
            var waitingBox = app.showWaitingBox(app.resourceTxts.loading);		// Show the waiting box
            var result = app.deleteAnnoSetItem(annoSetRid);	// Delete the annotation set item on server			
            if (result instanceof Error)
                deleteFailedHandler();
            else
                afterDeleteSuccessHandler();
            app.closeWaitingBox(waitingBox);		// Close the waiting box		
        };
    };

    // Add module to app
    app['annoSetsSearchModule'] = {
        view: view,
        controller: controller
    };

    return {
        view: view,
        controller: controller
    };
});
define('annojs/selectionDialog',['annojs/app', 'annoCgscript'], function (app, annoCgscript) {

    //////////////////////////////////////
    // The default resource object
    //////////////////////////////////////	
    var _defaultRes = {
        'buttonLabel': ko.observable('Noteringer'),
        'closeButton': ko.observable('Luk'),
        'comments': ko.observable('Klik på dine noteringer og luk på [x], klik derefter knappen \"Opdater\" for at se dine valg.'),
        'endDateLabel': ko.observable('Slutdato'),
        'expandAll': ko.observable('Udvid alle'),
        'header': ko.observable('Noteringer'),
        'overLimitWarning': ko.observable('Det maksimale antal søjler som kan vises i diagrammet er [LimitNumber].'),
        'selectAll': ko.observable('Vælg alle'),
        'selectedText': ko.observable('Valgte'),
        'startDateLabel': ko.observable('Startdato'),
        'unexpandAll': ko.observable('Skjul detaljer'),
        'unselectAll': ko.observable('Fravælg alle'),
        'updateButton': ko.observable('Genopfrisk diagram'),
        'notShowLabelsOnPlotBands': ko.observable('Undgå overlappende label (skift layout til muse-visning)')
    };

    /**
    *   annoDataDialog class
    *
    *   @classDescription
    *   @private
    *   @param {Object} p  The parameter object which contains below properties:   
    *                           {Array} itemsList  The items list     
    *                           {Any} resultStorage  The storage will store the selected result
    *                           {Object} [res]  Optional|The resources object
    *                           {Number} [maxSelectedItems] Optional|The maximum number of allowed selected items
    *                           {Array} [defaultSelectedItems] Optional|The default selected items which will be selected in case of no items is selected
    *                           {Array} [selectedItems] Optional|The selected items which will be selected     
    *                           {Function} [afterClosedWithoutUpdateCallback] The callback will be excuted after the dialog is closed but without update parameter is false
    *                           {Function} [afterClosedWithUpdateCallback] The callback will be excuted after the dialog is closed but with update parmater is true
    *                           
    *                           Extra properties:
    *                           {Object} notShowLabelsOnPlotBands  The setting of feature for showing the labels in chart tooltip 
    */
    var annoDataDialog = function (p) {
        var start = new Date().getTime();

        function unixTimeToPrettyDate(unixTimeInMiliSecond) {
            var a = new Date(Number(unixTimeInMiliSecond));
            var months = ["Jan", "Febr", "Marts", "April", "Maj", "Juni", "Juli", "Aug", "Sept", "Okt", "Nov", "Dec"];
            var year = a.getFullYear();
            var month = months[a.getMonth()];
            var date = a.getDate();
            var hour = a.getHours();
            var min = a.getMinutes();
            var sec = a.getSeconds();
            return date + ' ' + month + ' ' + year;
        }

        function convertMM_DD_YYYYToDD_MM_YYYY(d) {
            var p, year, month, day;
            p = d.replace(/[ ]/ig, '').split('-');  // Remove all space characters then split by '-'       
            day = p[1]; month = p[0]; year = p[2];
            return day + '/' + month + '/' + year;
        }

        if (!(p.itemsList && p.resultStorage))
            return new Error('annotationDialog: annoDataDialog class -> The "itemsList" and "resultStorage" parameters are required.');

        //
        // Define static properties
        //
        var self = this,
            itemsList = p.itemsList,
            resultStorage = p.resultStorage,
            res = p.res || _defaultRes,
            maxSelectedItems = p.maxSelectedItems || 9999,
            defaultSelectedItems = p.defaultSelectedItems || [],
            selectedItems = p.selectedItems || [],            
            afterClosedWithoutUpdateCallback = p.afterClosedWithoutUpdateCallback,
            afterClosedWithUpdateCallback = p.afterClosedWithUpdateCallback,
            _totalSelectedSubItemsOfAllParentItems = ko.observable(0),
            _subItemsSelectedStatusOfAllParentItems = ko.observableArray([]).extend({ notify: 'always' });

        //
        // Define public properties
        //   
        self.notShowLabelsOnPlotBands = p.notShowLabelsOnPlotBands;
        if (self.notShowLabelsOnPlotBands && !self.notShowLabelsOnPlotBands.name()) {
            self.notShowLabelsOnPlotBands.name = _defaultRes.notShowLabelsOnPlotBands;
        }
        self.computedOverLimitWarningText = ko.computed(function () {
            if (!res.overLimitWarning)
                return '';
            var txt = res.overLimitWarning(); // dependency
            txt = txt.replace(/\[LimitNumber\]/g, maxSelectedItems);
            return txt;
        }, self);

        //
        // Define public methods
        //
        self.getItemsList = function () {
            return itemsList;
        };
        self.getRes = function () {
            return res;
        };
        self.setRes = function (v) {
            res = v;
        };
        self.getAfterClosedWithoutUpdateCallback = function () {
            return afterClosedWithoutUpdateCallback;
        };
        self.getAfterClosedWithUpdateCallback = function () {
            return afterClosedWithUpdateCallback;
        };
        self.saveResultToStorage = function () {
            var r = this.getSelectedItems();
            if (ko.isObservable(resultStorage)) // is Observable
                resultStorage(r);
            else if (resultStorage instanceof Array) {// is not Observable and is array
                resultStorage.length = 0; // remove all elements
                $.extend(true, resultStorage, r);
            }
        };
        self.getMaxSelectedItems = function () {
            return maxSelectedItems;
        };
        self.setMaxSelectedItems = function (v) {
            maxSelectedItems = v;
        };
        self.getTotalSelectedSubItemsOfAllParentItems = function () {
            return _totalSelectedSubItemsOfAllParentItems();
        };
        self.toggleSelectedAllParentItems = function (v) {
            //app.loading(true);
            // Un-select all options of all axes, even if the value is true.
            ko.utils.arrayForEach(_subItemsSelectedStatusOfAllParentItems(), function (isSelected) {
                isSelected() ? isSelected(false) : null;
            });
            if (v) {
                // We did un-selected all options all axes in the above step
                // The select all options of all axes
                ko.utils.arrayForEach(_subItemsSelectedStatusOfAllParentItems(), function (isSelected) {
                    if (_totalSelectedSubItemsOfAllParentItems() < maxSelectedItems)
                        !isSelected() ? isSelected(true) : null;
                });
            }
            //app.loading(false);
        };
        self.getSelectedItems = function () {
            var self = this, result = [];
            $.each(itemsList, function (i, parentItem) {
                var r = {
                    rid: parentItem.rid,
                    annotationSetName: parentItem.name,
                    items: []
                };
                $.each(parentItem.items, function (k, subItem) {
                    if (subItem.isSelected())
                        r.items.push(subItem.annotationName);
                });
                if (r.items.length > 0)
                    result.push(r);
            });
            if (result.length === 0 && defaultSelectedItems.length > 0) {
                self.setSelectedItems(defaultSelectedItems);
                result = self.getSelectedItems();
            }
            return result;
        };
        self.setSelectedItems = function (selectedValues) {
            var self = this;
            selectedValues = $.extend(true, [], ko.toJS(selectedValues));
            // First, unselect all parent items
            self.toggleSelectedAllParentItems(false);
            // Then select the items based on the input values
            $.each(selectedValues, function (i, v) {
                var selectedParentItemName;
                if (typeof v === 'string')
                    selectedParentItemName = v;
                else
                    selectedParentItemName = v.annotationSetName;
                $.each(itemsList, function (_, parentItem) { // Iterating over all parent items
                    if (selectedParentItemName !== parentItem.name)
                        return true; // go to the parent item
                    // This is the parent item we are finding  
                    $.each(parentItem.items, function (_, subItem) {
                        // The given value is just the name of the parent item only
                        if (typeof v === 'string' && !subItem.isSelected())
                            subItem.isSelected(true);
                            // The given value is an object which specify the parent item and its selected sub items
                        else {
                            if (v.items.indexOf(subItem.annotationName) !== -1 && !subItem.isSelected())
                                subItem.isSelected(true);
                        }
                    });
                });
            });
        };
        self.unExpandAll = function () {
            var self = this;
            $.each(itemsList, function (i, parentItem) {
                parentItem.isExpanded(false);
            });
        };

        //
        // Process on each parent item
        //
        $.each(itemsList, function (i, parentItem) {
            var subItemSelectedStatusList = ko.observableArray([]).extend({ notify: 'always' });

            // Add extra properties to the item
            parentItem.isExpanded = ko.observable(false);
            parentItem.toggleSelectedAll = function () {
                //app.loading(true);
                var _this = this,
                    items = _this.items,
                    r = true,
                    isAllSubItemsSelected = _this.isAllSubItemsSelected();
                $.each(items, function (i, subItem) {
                    if (isAllSubItemsSelected) // Means un-select all
                        subItem.isSelected(false);
                    else  // Means select all
                        subItem.isSelected(true);
                });
                //app.loading(false);
                return r;
            };
            parentItem.getTotalSelectedSubItems = ko.computed(function () {
                subItemSelectedStatusList(); // Depend            
                var cnt = 0;
                $.each(subItemSelectedStatusList(), function (i, selectedStatus) {
                    selectedStatus.peek() ? cnt++ : null;
                });
                return cnt;
            });
            parentItem.isAllSubItemsSelected = ko.computed(function () {
                subItemSelectedStatusList(); // Depend                    
                if (ko.toJS(subItemSelectedStatusList).indexOf(false) !== -1)
                    return false;
                else
                    return true;
            });

            // Process on each sub item        
            $.each(parentItem.items, function (k, subItem) {
                // Convert start dates of sub item into pretty dates                      
                subItem.prettyStart = subItem.start;    // Please dont change value of subItem.start because perhap it also is used at somewhere else too
                if (isNaN(subItem.prettyStart)) {       // Perhaps the date is storing as dd/mm/yyyy or mm-dd-yyyy 
                    subItem.prettyStart = subItem.prettyStart.replace(/[ ]/ig, '');     // Remove all space characters
                    if (subItem.prettyStart.indexOf("-") !== -1)                        // is mm-dd-yyyy so now need to change it to dd/mm/yyyy so the new Date() can return the valid date
                        subItem.prettyStart = convertMM_DD_YYYYToDD_MM_YYYY(subItem.prettyStart);
                    subItem.prettyStart = (new Date(subItem.prettyStart)).getTime();
                }
                subItem.prettyStart = Number(subItem.prettyStart);  // convert to number for sure
                subItem.prettyStart = unixTimeToPrettyDate(subItem.prettyStart);

                // Convert end dates of sub item into pretty dates  
                subItem.prettyEnd = subItem.end;    // Please dont change value of subItem.start because perhap it also is used at somewhere else too
                if (isNaN(subItem.prettyEnd)) {     // Perhaps the date is storing as dd/mm/yyyy or mm-dd-yyyy 
                    subItem.prettyEnd = subItem.prettyEnd.replace(/[ ]/ig, '');  // Remove all space characters
                    if (subItem.prettyEnd.indexOf("-") !== -1)                   // is mm-dd-yyyy so now need to change it to dd/mm/yyyy so the new Date() can return the valid date
                        subItem.prettyEnd = convertMM_DD_YYYYToDD_MM_YYYY(subItem.prettyEnd);
                    subItem.prettyEnd = (new Date(subItem.prettyEnd)).getTime();
                }
                subItem.prettyEnd = Number(subItem.prettyEnd);      // convert to number for sure
                subItem.prettyEnd = unixTimeToPrettyDate(subItem.prettyEnd);

                // Mapping style values of options into color codes
                //subItem.annotationStyleColor = app.hex2rgb(app.styleColors[subItem.annotationStyleValue], 0.6); // Color in rgba (transparency) format causes ko style binding not work in IE<9, but works fine in non-transparency (rgb and hex) format                
                subItem.annotationStyleColor = app.styleColors[subItem.annotationStyleValue];

                // Add extra properties to the sub item
                subItem.isSelected = ko.observable(false);
                subItem.isSelected.subscribe(function () {
                    var _this = this, cnt = 0;
                    $.each(_subItemsSelectedStatusOfAllParentItems(), function (i, selectedStatus) {
                        selectedStatus() ? cnt++ : null;
                    });
                    if (cnt > maxSelectedItems) {
                        _this.isSelected(false); // Just this case will trigger this subscribed callback again
                        return;
                    }
                    _totalSelectedSubItemsOfAllParentItems(cnt);
                }, subItem, 'change');

                subItemSelectedStatusList.push(subItem.isSelected);
                _subItemsSelectedStatusOfAllParentItems.push(subItem.isSelected);
            });
        });

        //
        // Set the specified selected options
        //
        if (ko.toJS(selectedItems).length > 0)
            self.setSelectedItems(selectedItems);

        //
        // Set default selected items in case the default selected items is specified and no selected items
        //
        if (!(selectedItems.length > 0) && defaultSelectedItems.length > 0)
            self.setSelectedItems(defaultSelectedItems);

        var end = new Date().getTime();
        var dur = (end - start) / 1000;
        //system.log(['annoDataDialog class -> init annoDataDialog class - Time in second: ', dur]);
    };

    //////////////////////////////////////
    // The default dialog layout
    //////////////////////////////////////	
    var _defaultLayout = "";
    _defaultLayout += "<div class=\"\" style=\"width: 850px\">";
    _defaultLayout += "    <!-- ko with: $root.getDialogInstance() -->";
    _defaultLayout += "    <div class=\"modal-header\" style=\"padding: 0px 20px;\">";
    _defaultLayout += "        <h3 data-bind=\"text: getRes().header()\"><\/h3>";
    _defaultLayout += "    <\/div>";
    _defaultLayout += "";
    _defaultLayout += "    <!-- ko if: getTotalSelectedSubItemsOfAllParentItems() -->";
    _defaultLayout += "    <div class=\"modal-header\" style=\"padding: 0px 0px; overflow: auto; font-weight: bold; font-size: 14px;\">";
    _defaultLayout += "        <!-- ko if: getTotalSelectedSubItemsOfAllParentItems() >= getMaxSelectedItems() -->";
    _defaultLayout += "        <p style=\"margin-bottom: 0px; padding: 10px 20px 0px 20px; color: red;\">";
    _defaultLayout += "            <span class=\"glyphicon glyphicon-warning-sign\" style=\"padding-right: 5px;\"><\/span><span data-bind=\"text: computedOverLimitWarningText()\"><\/span>";
    _defaultLayout += "        <\/p>";
    _defaultLayout += "        <!-- \/ko -->";
    _defaultLayout += "        <p style=\"padding: 10px 20px 0px 20px; color: green;\">";
    _defaultLayout += "            <span class=\"btn disable-button-effect glyphicon glyphicon-check\" style=\"padding-left: 0px;\"><\/span><span class=\"btn disable-button-effect\" style=\"padding-left: 0px; font-weight: bold;\" data-bind=\"text: getTotalSelectedSubItemsOfAllParentItems()\"><\/span>";
    _defaultLayout += "            <button type=\"button\" class=\"remove-all-button btn btn-default\" style=\"float: right\" data-bind=\"click: function() { toggleSelectedAllParentItems(false); }\">";
    _defaultLayout += "	               <span data-bind=\"text: getRes().unselectAll()\"><\/span>";
    _defaultLayout += "            <\/button>";
    _defaultLayout += "        <\/p>";
    _defaultLayout += "    <\/div>";
    _defaultLayout += "    <!-- \/ko -->";
    _defaultLayout += "    <!-- ko if: getTotalSelectedSubItemsOfAllParentItems() -->";
    _defaultLayout += "    <div class=\"modal-header\" style=\"max-height: 120px; padding: 5px 0px; overflow: auto; font-size: 8pt; border-bottom: 10px solid #e5e5e5;\">";
    _defaultLayout += "        <!-- ko foreach: {data: getItemsList(), as: 'parentItem'} -->";
    _defaultLayout += "        <!-- ko foreach:  {data: parentItem.items, as: 'subItem'} -->";
    _defaultLayout += "        <!-- ko if: subItem.isSelected -->";
    _defaultLayout += "        <div class=\"selected-axis-option hover-highlight no-select\" data-bind=\"click: function() {isSelected(!isSelected());}, clickBubble: false\" style=\"width: 100%; padding: 0px 20px;\">";
    _defaultLayout += "            <input type=\"checkbox\" data-bind=\"checked: isSelected, click: function() {return true;}, clickBubble: false\">";
    _defaultLayout += "            <span data-bind=\"text: $parent.name + ' | '\" style=\"font-weight: bold;\"><\/span><span data-bind=\"text: annotationName\"><\/span>";
    _defaultLayout += "        <\/div>";
    _defaultLayout += "        <!-- \/ko-->";
    _defaultLayout += "        <!-- \/ko-->";
    _defaultLayout += "        <!-- \/ko-->";
    _defaultLayout += "    <\/div>";
    _defaultLayout += "    <!-- \/ko -->";
    _defaultLayout += "";
    _defaultLayout += "    <div class=\"modal-body\" style=\"min-height: 200px; max-height: 350px; padding-top: 0px; padding-right: 0px; padding-left: 0px; overflow: auto;\">";
    _defaultLayout += "        <!-- ko foreach: {data: getItemsList(), as: 'parentItem'} -->";
    _defaultLayout += "        <div class=\"item hover-highlight no-select\" style=\"clear: both; width: 100%; padding: 10px 0px 10px 20px; border-top: 2px solid;\">";
    _defaultLayout += "            <div class=\"item-name\" data-bind=\"click: function(parentItem, event) {$root.toggleExpand(parentItem, event);}, clickBubble: false\" style=\"width: 100%;\">";
    _defaultLayout += "                <input type=\"checkbox\" data-bind=\"checked: isAllSubItemsSelected, click: function() { return toggleSelectedAll();}, clickBubble: false\">";
    _defaultLayout += "                <span data-bind=\"text: name\" style=\"width: 100%; font-weight: bold; font-size: 14px;\"><\/span>";
    _defaultLayout += "                <!-- ko if: parentItem.getTotalSelectedSubItems -->";
    _defaultLayout += "                <span class=\"selected-sub-items-count\" data-bind=\"text: parentItem.getTotalSelectedSubItems()\" style=\"float: right; color: green;\"><\/span>";
    _defaultLayout += "                <span class=\"selected-sub-items-count glyphicon glyphicon-check\" style=\"float: right; padding-right: 5px; color: green;\"><\/span>";
    _defaultLayout += "                <!-- \/ko-->";
    _defaultLayout += "            <\/div>";
    _defaultLayout += "            <!-- ko if: parentItem.isExpanded -->";
    _defaultLayout += "            <!-- ko foreach: parentItem.items -->";
    _defaultLayout += "            <div class=\"item-option\" style=\"clear: both; width: 100%; padding: 10px 20px; font-size: 12px;\">";
    _defaultLayout += "                <div class=\"item-option-checkbox-container\" style=\"float: left; padding: 15px 10px; border-top: 1px solid #D5D5D5;\">";
    _defaultLayout += "                    <input class=\"item-option-checkbox\" type=\"checkbox\" data-bind=\"checked: isSelected, click: function() {return true;}, clickBubble: false\">";
    _defaultLayout += "                <\/div>";
    _defaultLayout += "                <div style=\"float: left; width: 85%\">";
    _defaultLayout += "                    <p class=\"item-option-name\" data-bind=\"text: annotationName\" style=\"margin: 0px; border-top: 1px solid #D5D5D5; font-weight: bold; padding: 5px 0px;\"><\/p>";
    _defaultLayout += "                    <span class=\"item-option-color\" data-bind=\"style: {backgroundColor: annotationStyleColor}\" style=\"width: 100px; height: 15px; float: right;\"><\/span>";
    _defaultLayout += "                    <span class=\"item-option-label\" data-bind=\"text: $parents[1].getRes().startDateLabel() + ':'\" style=\"padding-right: 5px;\"><\/span><span class=\"item-option-start\" data-bind=\"text: prettyStart\" style=\"padding-right: 30px;\"><\/span>";
    _defaultLayout += "                    <span class=\"item-option-label\" data-bind=\"text: $parents[1].getRes().endDateLabel() + ':'\" style=\"padding-right: 5px;\"><\/span><span class=\"item-option-end\" data-bind=\"text: prettyEnd\"><\/span>";
    _defaultLayout += "                <\/div>";
    _defaultLayout += "            <\/div>";
    _defaultLayout += "            <!-- \/ko-->";
    _defaultLayout += "            <div style=\"clear: both;\"><\/div>";
    _defaultLayout += "            <!-- \/ko-->";
    _defaultLayout += "        <\/div>";
    _defaultLayout += "        <!-- \/ko-->";
    _defaultLayout += "    <\/div>";
    _defaultLayout += "    <div class=\"modal-footer\">";
    _defaultLayout += "        <!-- ko with: $root.getDialogInstance().notShowLabelsOnPlotBands -->";
    _defaultLayout += "        <span class=\"show-labels-in-chart-tooltip\" data-bind=\"click: function(o, event) { toggle(o, event);}, clickBubble: false\" style=\"float: left; padding-left: 5px;\">";
    _defaultLayout += "            <input type=\"checkbox\" data-bind=\"value: name, checked: isSelected, click: function() {return true;}, clickBubble: false\">";
    _defaultLayout += "            <span data-bind=\"text: name\" style=\"font-weight: bold; font-size: 12px; color: #3071a9;\"><\/span>";
    _defaultLayout += "        <\/span>";
    _defaultLayout += "        <!-- \/ko-->";
    _defaultLayout += "        <button class=\"btn btn-primary\" data-bind=\"click: function () { $root.closeDialog.call($root, true); }, text: getRes().updateButton()\"><\/button>";
    _defaultLayout += "        <button class=\"btn\" data-bind=\"click: function () { $root.closeDialog.call($root); }, text: getRes().closeButton()\"><\/button>";
    _defaultLayout += "    <\/div>";
    _defaultLayout += "    <!-- \/ko-->";
    _defaultLayout += "    <style type=\"text\/css\">";
    _defaultLayout += "     .annotationsets-selection-dialogbox .disable-button-effect {";
    _defaultLayout += "            color: inherit;";
    _defaultLayout += "            cursor: initial;";
    _defaultLayout += "            -ms-touch-action: none;";
    _defaultLayout += "            touch-action: none;";
    _defaultLayout += "            -webkit-box-shadow: none;";
    _defaultLayout += "            box-shadow: none;";
    _defaultLayout += "            outline: none;";
    _defaultLayout += "            outline-offset: initial;";
    _defaultLayout += "        }";
    _defaultLayout += "     .annotationsets-selection-dialogbox .disable-button-effect:hover {";
    _defaultLayout += "            color: inherit;";
    _defaultLayout += "            cursor: inherit;";
    _defaultLayout += "        }";
    _defaultLayout += "	    .annotationsets-selection-dialog-content .modalBlockout {";
    _defaultLayout += "	        position: fixed;";
    _defaultLayout += "	        top: 0;";
    _defaultLayout += "	        left: 0;";
    _defaultLayout += "	        width: 100%;";
    _defaultLayout += "	        height: 100%;";
    _defaultLayout += "	        background: black;";
    _defaultLayout += "	        opacity: 0;";
    _defaultLayout += "	        pointer-events: auto;";
    _defaultLayout += "	        -webkit-backface-visibility: hidden;";
    _defaultLayout += "	        -webkit-transition: opacity 0.1s linear;";
    _defaultLayout += "	        -moz-transition: opacity 0.1s linear;";
    _defaultLayout += "	        -o-transition: opacity 0.1s linear;";
    _defaultLayout += "	        transition: opacity 0.1s linear;";
    _defaultLayout += "	    }";
    _defaultLayout += "	    .annotationsets-selection-dialog-content .modalHost {";
    _defaultLayout += "	        top: 50%;";
    _defaultLayout += "	        left: 50%;";
    _defaultLayout += "	        position: fixed;";
    _defaultLayout += "	        opacity: 0;";
    _defaultLayout += "	        -webkit-backface-visibility: hidden;";
    _defaultLayout += "	        -webkit-transition: opacity 0.1s linear;";
    _defaultLayout += "	        -moz-transition: opacity 0.1s linear;";
    _defaultLayout += "	        -o-transition: opacity 0.1s linear;";
    _defaultLayout += "	        transition: opacity 0.1s linear;";
    _defaultLayout += "	    }";
    _defaultLayout += "	    .annotationsets-selection-dialog-content .messageBox {";
    _defaultLayout += "	        background-color: white;";
    _defaultLayout += "	        border: 1px solid #999;";
    _defaultLayout += "	        border: 1px solid rgba(0, 0, 0, 0.3);";
    _defaultLayout += "	        -webkit-border-radius: 6px;";
    _defaultLayout += "	        -moz-border-radius: 6px;";
    _defaultLayout += "	        border-radius: 6px;";
    _defaultLayout += "	        outline: none;";
    _defaultLayout += "	        -webkit-box-shadow: 0 3px 7px rgba(0, 0, 0, 0.3);";
    _defaultLayout += "	        -moz-box-shadow: 0 3px 7px rgba(0, 0, 0, 0.3);";
    _defaultLayout += "	        box-shadow: 0 3px 7px rgba(0, 0, 0, 0.3);";
    _defaultLayout += "	        -webkit-background-clip: padding-box;";
    _defaultLayout += "	        -moz-background-clip: padding-box;";
    _defaultLayout += "	        background-clip: padding-box;";
    _defaultLayout += "	        min-width: 300px;";
    _defaultLayout += "	    }";
    _defaultLayout += "	    .annotationsets-selection-dialog-content .modal-body {";
    _defaultLayout += "	        height: 400px;";
    _defaultLayout += "	        overflow: auto;";
    _defaultLayout += "	    }";
    _defaultLayout += "     .annotationsets-selection-dialog-content .modal-footer button {";
    _defaultLayout += "		    margin: 0px 0px 0px 5px !important;";
    _defaultLayout += "		    padding: 6px 12px !important;";
    _defaultLayout += "		    border-radius: 4px !important;";
    _defaultLayout += "	        -webkit-border-radius: 4px !important;";
    _defaultLayout += "	        -moz-border-radius: 4px !important;";
    _defaultLayout += "	    }";
    _defaultLayout += "	    .annotationsets-selection-dialog-content .modal-footer {";
    _defaultLayout += "		    padding: 15px;";
    _defaultLayout += "		    text-align: right;";
    _defaultLayout += "		    border-top: 1px solid #e5e5e5;";
    _defaultLayout += "	    }";
    _defaultLayout += "    <\/style>";
    _defaultLayout += "<\/div>";

    ///////////////////////////////////////////////////////
    // Define static properties of this module
    ////////////////////////////////////////////////////////
    var _annoDataDialogInstance, _dialogLayout, _dialogLayoutDomEl, _$dialogBox;

    app.selectionDialog = {
        init: function (dialogClassParameters /* Object - Required */, dialogLayout /* String - Optional */) {
            _annoDataDialogInstance = new annoDataDialog(dialogClassParameters);
            _dialogLayout = dialogLayout || _defaultLayout;
            return _annoDataDialogInstance;
        },

        setDialogInstance: function (obj) {
            _annoDataDialogInstance = obj;
        },

        getDialogInstance: function () {
            return _annoDataDialogInstance;
        },

        setDialogLayout: function (layout) {
            _dialogLayout = layout;
        },

        getDialogLayout: function () {
            return _dialogLayout;
        },

        toggleExpand: function (itemObj, event) {
            $(event.currentTarget).siblings('.item-option').toggle();
            itemObj.isExpanded(true);
        },

        showDialog: function ($dialogOptions) {
            var self = this;
            _dialogLayoutDomEl = $(_dialogLayout).get(0);
            ko.applyBindings(this, _dialogLayoutDomEl);

            var opts = {
                modal: true,
                dialogClass: 'annotationsets-selection-dialogbox',
                width: 870,
                minHeight: 400,
                resizable: false,
                draggable: false,
                create: function () {
                    $('div.ui-dialog-titlebar').remove();  // Remove dialog title bar
                },
                close: function () {
                    $(this).remove();
                }
            };
            if ($.isPlainObject($dialogOptions))
                $.extend(opts, $dialogOptions);
            _$dialogBox = $(_dialogLayoutDomEl).dialog(opts);
            _$dialogBox.parent().css({ 'top': '40px' }); // Move the dialog box to position at 50px from the top browser view port instead of always center 
        },

        closeDialog: function (update) {
            var self = this;
            _$dialogBox.dialog('destroy');
            ko.removeNode(_dialogLayoutDomEl);

            _annoDataDialogInstance.unExpandAll();                      // Reset the expand status of all items         
            _annoDataDialogInstance.saveResultToStorage();              // Save selected result into the result storage

            // Excuted the after closed callbacks 
            if (update && _annoDataDialogInstance.getAfterClosedWithUpdateCallback())
                _annoDataDialogInstance.getAfterClosedWithUpdateCallback()();
            if (!update && _annoDataDialogInstance.getAfterClosedWithoutUpdateCallback())
                _annoDataDialogInstance.getAfterClosedWithoutUpdateCallback()();
        }
    };
});

requirejs.config({
    paths: {
            },
    waitSeconds: 60
});

define('annoappApi',['annojs/app', 'annojs/item', 'annojs/itemsManagement', 'annojs/itemsSearch', 'annojs/selectionDialog', 'annoCgscript'],
    function (app, annoItem, annoItemsManagement, annoItemsSearch, selectionDialog, annoCgscript) {

      var appCaller = function (appInstance) {
        // The context of the 'this' of this function will be the thisAppInstance object	
        var self = this, cssClass, groupCheckResult, html;
        cssClass = {
            appLogoClass: 'annotationBoard_logo',
            appNameClass: 'annotationBoard_boardName',
            menuItemClickedClass: 'annotationBoard_menuItem_Clicked',
            menuItemMouseOverClass: 'annotationBoard_menuItem_MouseOver',
            appContainerId: 'annotationBoard_pageContainer',
            appMessagesId: 'annotationBoard_pageMessages',
            appHeaderId: 'annotationBoard_pageHeader',
            appLeftSideId: 'annotationBoard_pageLeftSide',
            appRightSideId: 'annotationBoard_pageRightSide',
            createMenuItemClass: 'annotationBoard_create_MenuItem',
            manageMenuItemClass: 'annotationBoard_manage_MenuItem',
            searchMenuItemClass: 'annotationBoard_search_MenuItem'
        };

        groupCheckResult = app.checkGroupExceptions();
        if (groupCheckResult === undefined) {
            alert('There was problem happened at the XMLHttpRequest for users group checking of this application.');
            return;
        }          
        else if (groupCheckResult instanceof Error) {
            alert('There was problem happened at the backend of this application. Please contact the administrator of this site for supporting.');
            return;
        }
        else if (groupCheckResult === false) {
            alert('This application is unavailable due to your account dont belong to any group defined by this application. Please contact the administrator of this site for supporting.');
            return;
        }

        html = '<div id="annoApp">'
                    + '<div id="' + cssClass.appContainerId + '" class="' + this.appInstanceId + '">'
                        + '<div id="' + cssClass.appMessagesId + '"></div>'
                        + '<div id="' + cssClass.appHeaderId + '">'    
                        + '<span class="' + cssClass.appNameClass + '">Annotation sæt administration</span>'
                        + '</div>'
                        + '<div id="' + cssClass.appLeftSideId + '">'
                        + '<div class="' + cssClass.searchMenuItemClass + '" title="' + app.resourceTxts.search + '"><span class="glyphicon glyphicon-search" style="margin-right: 5px;" title="' + app.resourceTxts.search + '"></span></div>'
                        + '<div class="' + cssClass.createMenuItemClass + '" title="' + app.resourceTxts.createNew + '"><span class="glyphicon glyphicon-plus" style="margin-right: 5px;" title="' + app.resourceTxts.createNew + '"></span></div>'
                        + '<div class="' + cssClass.manageMenuItemClass + '" title="' + app.resourceTxts.administration + '"><span class="glyphicon glyphicon-list" style="margin-right: 5px;" title="' + app.resourceTxts.administration + '"></span></div>'
                        + '</div>'
                        + '<div id="' + cssClass.appRightSideId + '"></div>'
                    + '</div>'
                + '</div>';

        app.dialogBox($(html), {
            modal: true,
            width: '1145px',
            buttons: { 'Luk': function () { $(this).dialog('destroy').remove(); } }
        });

        var emptyAppRightSideContent = function () {
            $(' #' + cssClass.appRightSideId).html('');
        };

        $('.' + cssClass.searchMenuItemClass)
            .click(function () {
                emptyAppRightSideContent();
                self.map['load VIEW of annoSetsSearchModule'].apply(self, [{ viewLocation: cssClass.appRightSideId }]);
            }
        );

        $('.' + cssClass.createMenuItemClass)
            .click(function () {
                emptyAppRightSideContent();
                self.map['load VIEW of annoSetItemModule'].apply(self, [{ viewLocation: cssClass.appRightSideId }]);
            }
        );

        $('.' + cssClass.manageMenuItemClass)
            .click(function () {
                emptyAppRightSideContent();
                self.map['load VIEW of annoSetsManagementModule'].apply(self, [{ viewLocation: cssClass.appRightSideId }]);
            }
        );

        $('#' + cssClass.appLeftSideId + ' div')
            .click(function (e) {
                $(this).siblings().removeClass(cssClass.menuItemClickedClass);
                $(this).addClass(cssClass.menuItemClickedClass);
            })
            .hover(function (e) {
                $(this).toggleClass(cssClass.menuItemMouseOverClass);
            });
    };

    var map = {
        'load VIEW of annoSetsSearchModule': function (paraObj) {
            // The context of the 'this' of this function will be the thisAppInstance object				
            var viewCssId = 'annotationBoard_searchAnnotationsView';
            var module = {};
            module.view = new app['annoSetsSearchModule'].view(this, paraObj['viewLocation'], viewCssId);  	// Instantiate the View object 
            module.controller = new app['annoSetsSearchModule'].controller(this);			// Instantiate the Controller object
            module.view.setController(module.controller);
            module.controller.setView(module.view);

            module.view.render();
        },

        'load VIEW of annoSetItemModule': function (paraObj) {
            // The context of the 'this' of this function will be the thisAppInstance object
            var viewCssId = 'annotationBoard_AnnotationSetItemView';
            var module = {};
            module.view = new app['annoSetItemModule'].view(this, paraObj['viewLocation'], viewCssId);  	// Instantiate the View object 
            module.controller = new app['annoSetItemModule'].controller(this);		// Instantiate the Controller object
            module.view.setController(module.controller);
            module.controller.setView(module.view);

            module.view.render(paraObj['annotationSetRid'], paraObj['afterDeleteCloseHandler']);		// CREATE new annotation set or OPEN an annotation set based on annotationSetRid																
        },

        'load VIEW of annoSetsManagementModule': function (paraObj) {
            // The context of the 'this' of this function will be the thisAppInstance object				
            var viewCssId = 'annotationBoard_manageAnnotationsView';
            var module = {};
            module.view = new app['annoSetsManagementModule'].view(this, paraObj['viewLocation'], viewCssId);  	// Instantiate the View object 
            module.controller = new app['annoSetsManagementModule'].controller(this);			// Instantiate the Controller object
            module.view.setController(module.controller);
            module.controller.setView(module.view);

            module.view.render();
        }
    };

    return {        
        app: app,
        annoCgscript: annoCgscript,
        appCaller: appCaller,
        map: map        
    };
});

}());