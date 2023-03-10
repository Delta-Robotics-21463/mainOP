/*
 * Copyright (c) 2018 David Sargent
 *
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted (subject to the limitations in the disclaimer below) provided that
 * the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list
 * of conditions and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice, this
 * list of conditions and the following disclaimer in the documentation and/or
 * other materials provided with the distribution.
 *
 * Neither the name of David Sargent nor the names of its contributors may be used to
 * endorse or promote products derived from this software without specific prior
 * written permission.
 *
 * NO EXPRESS OR IMPLIED LICENSES TO ANY PARTY'S PATENT RIGHTS ARE GRANTED BY THIS
 * LICENSE. THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
(function (env, $, console) {
    'use strict';
    // Add a change element type to jQuery
    // By jakov, from SO post "how to change an element type using jquery"
    $.fn.changeElementType = function (newType) {
        this.each(function () {
            var attrs = {};
            $.each(this.attributes, function (idx, attribute) {
                var nodeName = attribute.nodeName;
                if (nodeName === 'href' && newType !== 'a') return;

                attrs[nodeName] = attribute.value;
            });

            $(this).replaceWith($('<' + newType + ' />', attrs).append($(this).contents()));
        });
    };
    env.errors = {
        FILE_NOT_FOUND: "error=file_not_found",
        FILE_NOT_DIRECTORY: "error=file_not_directory",
    }

    env.installedEditorThemes = ['light', 'dark'];
    env.editorTheme = 'obj'; //env.settings.get('theme');

    env.getParameterByName = function getParameterByName(name) {
        const url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
        var results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    };

    env.fixedUriEncode = function fixedUriEncode(code) {
        return encodeURIComponent(code).replace(/[!'()*]/g, function (c) {
            return '%' + c.charCodeAt(0).toString(16);
        });
    };

    env.baseUrlRoot = (function baseUrlRoot() {
        return document.URL.substring(0, document.URL.indexOf(env.urls.URI_JAVA_PREFIX));
    })();

    env.javaUrlRoot = (function getJavaUrlRoot() {
        const currentUri = document.URL;
        return currentUri.substring(0, currentUri.indexOf(env.urls.URI_JAVA_PREFIX) + env.urls.URI_JAVA_PREFIX.length);
    })();

    function extractDocumentIdFromUri(currentUri) {
        const javaEditorWithParamQuery = env.urls.URI_JAVA_EDITOR + '?';
        if (currentUri.indexOf(javaEditorWithParamQuery) === -1) {
            return '';
        }

        var paramFileName = env.getParameterByName("f");
        if (paramFileName) {
            return paramFileName;
        }

        paramFileName = currentUri.substring(currentUri.indexOf(javaEditorWithParamQuery) + (javaEditorWithParamQuery).length);
        if (paramFileName !== '.java') {
            return paramFileName;
        }

        return '';
    }

    env.documentIdToTabName = function documentIdToTabName() {
        var strings = env.documentId.split('/');
        var page = strings[strings.length - 1];
        //$('#open-files #tab-1 span.file-id').text(page);
    };

    env.documentId = (function getDocumentId() {
        const currentUri = document.URL;
        return extractDocumentIdFromUri(currentUri);
    })();

    env._isFtcRobotController = (function () {
        if (typeof window.isFtcRobotController !== 'function') {
            console.warn('util.js has not been loaded');
            return false;
        }

        var promise = $.Deferred();
        loadRcInfo(function () {
           env._isFtcRobotController = window.isFtcRobotController();
           promise.resolve(env._isFtcRobotController);
        });

        return promise;
    })();

    env.whenFtcRobotController = function(yes, no) {
        if (typeof env._isFtcRobotController !== 'boolean') {
            console.warn('not ready for when, you must call this is from the callback in waitForRobotControllerDetect()');
        }
        return env._isFtcRobotController ? yes : no;
    };

    env.waitForFtcRobotControllerDetect = function(callback) {
        if (typeof callback !== 'function') return;
        $.when(env._isFtcRobotController).then(callback);
    };

    //noinspection JSUnusedGlobalSymbols
    env.trees = {
        defaultParameters: function defaultTreeParameters(dataTree, nodeSelected, nodeUnselected, backColor, hoverColor) {
            return {
                data: dataTree,
                expandIcon: 'fa fa-caret-right',
                collapseIcon: 'fa fa-caret-down',
                backColor: backColor,
                onhoverColor: hoverColor,
                enableLinks: true,
                showBorder: false,
                multiSelect: true,
                onNodeSelected: nodeSelected,
                onNodeUnselected: nodeUnselected,
                onRendered: function() {
                    $('li.node-file-tree a').click(e => {
                        var target = $(e.target);
                        var targetId = extractDocumentIdFromUri(target.attr('href'));
                        if (env.changeDocument && targetId) {
                            e.preventDefault();
                            env.changeDocument(targetId);
                        }
                    });
                }
            };
        },
        callbacks: { // for the UI system
            projectView: {
                nodeSelected: function () {

                },
                nodeUnselected: function () {

                }
            }
        },
        parse: {
            _findNodeInTree: function _findInTree(file, tree) {
                let restToMatch = file;
                let currNode = null;
                for (let node of tree) {
                    console.log(restToMatch, node.parentFile)
                    if (restToMatch.startsWith(node.parentFile + node.file + "/")) {
                        restToMatch = restToMatch.substr(node.parentFile.length + node.file.length + 1);
                        console.log(restToMatch);
                        currNode = node;
                    }
                }

                if (currNode === null) {
                    return env.errors.FILE_NOT_FOUND;
                }

                let foundNode = true;
                while (foundNode) {
                    foundNode = false;
                    for (let node of currNode.nodes) {
                        if (node.folder && restToMatch.startsWith(node.file + "/")) {
                            if (restToMatch === node.file + "/") {
                                return node;
                            }
                            restToMatch = restToMatch.substr(node.file.length + 1);
                            console.log(restToMatch);
                            currNode = node;
                            foundNode = true;
                            break;
                        // this only happens since we sometimes skip directories
                        // in the file tree view
                        } else if (file.startsWith(node.parentFile + node.file)) {
                            if (file === node.parentFile + node.file) {
                                return node;
                            }
                            restToMatch = file.substr(node.parentFile.length + node.file.length + 1);
                            console.log(restToMatch);
                            currNode = node;
                            foundNode = true;
                            break;
                        } else if (!node.folder && restToMatch.startsWith(node.file + "/")) {
                            return env.errors.FILE_NOT_DIRECTORY;
                        } else if (!node.folder && restToMatch === node.file) {
                            return node;
                        }
                    }
                }

                return env.errors.FILE_NOT_FOUND;
            },
            sourceTree: function parseSourceTree(fileTree) {
                env.allowExternalLibraries = fileTree.allowExternalLibraries;

                // Filter the jars directory out of the file tree data src file data before being parsed
                const JARS_DIR = '/jars';
                fileTree.src = fileTree.src.filter(function (node) {
                    return node.indexOf(JARS_DIR) !== 0;
                });

                env.trees.srcFiles = env.trees.parse._tree(fileTree.src, 'src');
                env.trees.findInSourceFiles = function findNodeInSource(file) {
                    return env.trees.parse._findNodeInTree(file, env.trees.srcFiles);
                }
                return env.trees.srcFiles;
            },
            librariesTree: function parseLibrariesTree(fileTree) {
                env.trees.jarFiles = env.trees.parse._tree(fileTree.jars, 'jars');
                env.trees.findInLibraries = function findNodeInLibraries(file) {
                    return env.trees.parse._findNodeInTree(file, env.trees.jarFiles);
                }
                return env.trees.jarFiles;
            },
            _tree: function parseFileTree(fileTree, fileNamespace) {
                const stage1Output = {};

                fileTree.forEach(function (element) {
                    var array = element.substr(1).split('/');
                    var lastState2 = stage1Output;

                    array.forEach(function(value) {
                        if (!lastState2.hasOwnProperty(value)) lastState2[value] = {};
                        lastState2 = lastState2[value];
                    });
                });

                var validFiles = [];

                function stage2Parser(prop, href, fileNamespace, parentNode) {
                    const resultsFiles = [];
                    const resultsFolder = [];

                    function hasExtension(ext) {
                        return attr.indexOf(ext, attr.length - ext.length) !== -1;
                    }

                    var iconForFile = function () {
                        if (hasExtension('.java')) {
                            return 'fa fa-file-code-o';
                        } else if (hasExtension('.zip')
                            || hasExtension('.jar') || hasExtension('.aar')) {
                            return 'fa fa-archive';
                        } else if (hasExtension('.txt') || hasExtension('.md')) {
                            return 'fa fa-file-text';
                        } else {
                            return 'fa fa-question';
                        }
                    };

                    for (var attr in prop) {
                        if (!prop.hasOwnProperty(attr)) continue; // skip if not a property we should worry about

                        if (attr === '' || hasExtension('.tmp')) continue;

                        const location = fileNamespace + '/';
                        var items = {
                            text: attr,
                            file: attr,
                            folder: false,
                            icon: iconForFile(),
                            parentFile: location,
                            parent: JSON.stringify(parentNode)
                        };

                        if (!(Object.keys(prop[attr]).length === 0 && prop[attr].constructor === Object)) { // detect folders
                            const children = stage2Parser(prop[attr], href, location + attr, items);
                            // We don't want the default '#' behavior, so literally do nothing
                            items.href = 'javaScript:void(0);';
                            items.file = items.text;
                            // Change item to have a folder icon
                            items.icon = 'fa fa-folder';
                            items.folder = true;
                            items.nodes = children;

                            // Check if nodes has only one child, if so rename to package layout
                            if (items.nodes.length === 1) {
                                const nodeToMerge = items.nodes[0];
                                if (nodeToMerge.hasOwnProperty('nodes')) { // don't merge if nodeToMerge isn't also a parent
                                    items = {
                                        text: items.text + '.' + nodeToMerge.text,
                                        nodes: nodeToMerge.nodes,
                                        href: nodeToMerge.href,
                                        parentFile: nodeToMerge.parentFile,
                                        file: nodeToMerge.file,
                                        icon: 'fa fa-folder',
                                        parentNode: nodeToMerge.parentNode,
                                        folder: true,
                                        parent: nodeToMerge.parent
                                    };
                                }
                            }

                            resultsFolder.push(items);
                        } else { // file
                            validFiles.push('/' + location + attr);
                            if (attr.endsWith('.jar') || attr.endsWith('.aar')) {
                              items.href = 'javaScript:void(0);';
                            } else {
                              items.href = href + '/' + location + attr;
                            }
                            resultsFiles.push(items);
                        }
                    }

                    const nodeSortFn = function (a, b) {
                        return a.text.localeCompare(b.text);
                    };

                    resultsFolder.sort(nodeSortFn);
                    resultsFiles.sort(nodeSortFn);
                    return resultsFolder.concat(resultsFiles);

                }

                const fileGetUri = env.javaUrlRoot + '/editor.html?';
                var ret = stage2Parser(stage1Output, fileGetUri, fileNamespace, null);
                console.log(validFiles);
                return ret;
            }
        },
        get: function getTree(callback, callbackFinished) {
            // Some logic to retrieve, or generate tree structure
            const treeUri = env.urls.URI_FILE_TREE;

            $.get(treeUri, function (data) {
                callback(env.trees.parse.sourceTree(data), callbackFinished);
            }).fail(function () {
                console.error("Getting file tree failed!");
            });
        },
        srcFiles: null,
        jarFiles: null
    };

    env.resizeLeftHandPanel = function resizeLeftHandPanel(handle, leftAmt, $editor, $file, shown) {
        handle.offset({
            left: leftAmt
        });

        $editor.css('width', (window.innerWidth - leftAmt) + 'px');
        $file.css('width', leftAmt + 'px');
        shown = leftAmt !== 0;
        ($('#file-tree-container')).perfectScrollbar('update');

        $('#left-pane').attr('min-width', function () {
            var minWidths = [300];
            var attrs = '';

            minWidths.forEach(function (minWidth) {
                if (minWidth < $('#left-pane').width()) {
                    attrs += minWidth + "px ";
                }
            });

            if (attrs.lastIndexOf(' ') === attrs.length - 1) {
                attrs = attrs.substr(0, attrs.length - 1);
            }
            return attrs;
        });

        shown = !shown;
        return !shown;
    };

    env.resizeBuildLogPane = function resizeBuildLogPane(y, buildLogHandle) {
        const editorContainer = $('#editor-component-container');
        const buildLogPane = $('#build-log-pane');
        const editor = $('#editor');
        buildLogHandle.offset({top: y});
        editorContainer.css('height', y + 'px');
        buildLogPane.css('height', (window.innerHeight - y) + 'px');
        editor.css('height', (y - 25) + 'px');
        if (typeof env.editor !== 'undefined') env.editor.resize();
    };

    env.resizeProjectFilesTree = function resizeProjectFilesTree(projectFileTree) {
        var number = ($('#left-pane').height() - $('#menu-container').height() -
        $('span.file-tree-title').height() - 15);
        number += 10;
        if (number > 10) {
            //noinspection JSJQueryEfficiency
            if ($('#left-pane[min-width~="300px"]').length) number += 49;
            projectFileTree.css('height', number + 'px');
        }
    };

    env.colors = (function() {
        let themeColors = ace.require('ace/theme/obj').color;
        console.log(themeColors);
        var cssEngine = function cssEngine(rule) {
            const css = document.createElement('style'); // Creates <style></style>
            css.type = 'text/css'; // Specifies the type
            if (css.styleSheet) css.styleSheet.cssText = rule; // Support for IE
            else css.appendChild(document.createTextNode(rule)); // Support for the rest
            document.getElementsByTagName('head')[0].appendChild(css); // Specifies where to place the css
        };

        let backColor = themeColors.primary_1;
        let hoverColor = themeColors.marker_layer_active_line_back;
        let gutterColor = themeColors.gutter_back;
        cssEngine('#menu-container .nav>li>a:hover { background-color: ' + hoverColor + '; }');
        cssEngine(`
            .ace-${env.editorTheme} .ace_gutter {
                background: ${themeColors.primary_1};
            }

            #open-files .file-tab.active-tab {
                background: ${themeColors.primary_1}
            }

            #left-pane, #file-tree .node-file-tree, #left-pane-handle, #build-log-handle {
                background-color: ${themeColors.primary_3};
            }
            `)

        // Setup colors to an empty object while we wait for the DOM modifications to take place, and the colors to be calculated
        return {
            hoverColor: hoverColor,
            backColor: backColor,
            gutterColor: gutterColor
        };
    })();

    env.setup = {
        projectView: function setupFileBrowsers(callback) {
            const treeSetupCallback = function treeSetupCallback(srcTree, callback) {
                var selectedNodes = function selectedNodes(treeView) {
                    return treeView.treeview('getSelected', 0);
                };

                var deselectValue = function deselectValue(value, treeView) {
                    treeView.treeview('unselectNode', [value, {silent: true}]);
                };

                var isSameNode = function isSameNode(node, value, treeView) {
                    if (node.text !== value.text) {
                        deselectValue(value, treeView);
                    } else {
                        const testNodeHasNodes = node.hasOwnProperty('nodes');
                        if (testNodeHasNodes === value.hasOwnProperty('nodes')) {
                            if (testNodeHasNodes) {
                                if (node.nodes.length === value.nodes.length) {
                                    for (var i = 0; i < node.nodes.length; i++) {
                                        isSameNode(node.nodes[i], value.nodes[i], treeView);
                                    }
                                } else {
                                    deselectValue(value, treeView);
                                }
                            }
                        } else {
                            deselectValue(value, treeView);
                        }
                    }
                };

                var generateTreeViewNodeUnselectionHandler = function generateTreeViewNodeUnselectionHandler(treeViews) {
                    return function (event, node) {
                        if (typeof env.trees.callbacks.projectView.nodeUnselected === 'function')
                            env.trees.callbacks.projectView.nodeUnselected();

                        if (env.keys.ctrl.pressed) return;
                        treeViews.forEach(function(treeView) {
                            var selected = selectedNodes(treeView);
                            if (selected.length < 1)  return;

                            selected.forEach(function (value) {
                                deselectValue(value, treeView);
                            });

                            treeView.treeview('selectNode', [node.nodeId, { silent: true}]);
                        });
                    };
                };

                var generateTreeViewNodeSelectionHandler = function generateTreeViewNodeSelectionHandler(treeViews) {
                    return function (event, node) {
                        if (typeof env.trees.callbacks.projectView.nodeSelected === 'function')
                            env.trees.callbacks.projectView.nodeSelected();

                        if (env.keys.ctrl.pressed) return;
                        treeViews.forEach(function(treeView) {
                            var selected = selectedNodes(treeView);

                            selected.forEach(function (value) {
                                isSameNode(node, value, treeView);
                                env.trees.callbacks.projectView.nodeSelected();
                            });
                        });
                    };
                };
                const $file = $('#file-tree');
                const nodeSelected = generateTreeViewNodeSelectionHandler([$file]);
                const nodeUnselected = generateTreeViewNodeUnselectionHandler([$file]);
                $file.treeview(env.trees.defaultParameters(srcTree, nodeSelected, nodeUnselected, env.colors.backColor, env.colors.hoverColor));

                if (typeof callback === 'function') {
                    callback();
                }
            };
            env.trees.get(treeSetupCallback, callback);
        },
        windowHandles: function setupWindowHandleEvents() {
            var $dragging = null;
            const $editor = $('#main-window');
            const $file = $('#left-pane');
            var target = '';
            var shown = true;

            var resizeTimeout;
            $(window).on('resize', function () {
                (function resizeThrottler() {
                    // ignore resize events as long as an actualResizeHandler execution is in the queue
                    if (resizeTimeout) {
                        return;
                    }

                    resizeTimeout = setTimeout(function () {
                        resizeTimeout = null;
                        actualResizeHandler();

                        // The actualResizeHandler will execute at a rate of 15fps
                    }, 66);
                })();

                function actualResizeHandler() {
                    const currentLeftPaneWidth = $file.width();
                    const width = env.screen.width;
                    const height = env.screen.height;
                    const actualPercentWidth = currentLeftPaneWidth / width;
                    env.resizeLeftHandPanel($('#left-pane-handle'), actualPercentWidth * env.screen.currentWidth(),
                        $editor, $file, true);
                    env.resizeProjectFilesTree($('#file-tree-container'));

                    const editor = $('#editor-component-container');
                    const currentEditorHeight = editor.height();

                    const actualPercentHeight = currentEditorHeight / height;
                    env.resizeBuildLogPane(actualPercentHeight * env.screen.currentHeight(), $('#build-log-handle'));
                }
            });

            $('#navbarMenuTarget').on('shown.bs.collapse', function () {
                const $left = $('#left-pane');
                const navHeight = $left.find('#menu-container .collapse.in ul').height() + 16;
                const viewHeight = $left.height() - $('div.navbar-header').height();
                //noinspection JSJQueryEfficiency
                $('#left-pane #menu-container .collapse.in')
                    .css('height', Math.min(navHeight, viewHeight) + 'px')
                    .css('overflow-y', 'visible') // NOT A BUG, this forces the browser to decide if scrollbars are needed
                    .css('overflow-y', 'auto');
                env.resizeProjectFilesTree($('#file-tree-container'));
            }).on('hidden.bs.collapse', function () {
                env.resizeProjectFilesTree($('#file-tree-container'));
            });

            const touchHandler = function touchHandlerF(event) {
                const touches = event.changedTouches,
                    first = touches[0];
                var type = "";
                switch (event.type) {
                    case "touchstart":
                        type = "mousedown";
                        break;
                    case "touchmove":
                        type = "mousemove";
                        break;
                    case "touchend":
                        type = "mouseup";
                        break;
                    default:
                        return;
                }

                const mouseEvent = new MouseEvent(type, {
                    'screenX': first.screenX,
                    'screenY': first.screenY,
                    'clientX': first.clientX,
                    'clientY': first.clientY,
                    'buttons': 0
                });

                if (type === 'mousemove' || type === 'mouseup') {
                    document.body.dispatchEvent(mouseEvent);
                } else {
                    first.target.dispatchEvent(mouseEvent);
                }
                event.preventDefault();
            };

            var elementIds = ['left-pane-handle', 'build-log-handle'];
            elementIds.forEach(function (elementId) {
                document.getElementById(elementId).addEventListener("touchstart", touchHandler, true);
                document.getElementById(elementId).addEventListener("touchmove", touchHandler, true);
                document.getElementById(elementId).addEventListener("touchend", touchHandler, true);
                document.getElementById(elementId).addEventListener("touchcancel", touchHandler, true);
            });

            // https://jsfiddle.net/Jge9z/
            $(document.body).on("mousemove", function (e) {
                const x = e.clientX;
                const y = e.clientY;
                if ($dragging) {
                    const projectFileTree = ($('#file-tree-container'));
                    const buildLogHandler = $('#build-log-handle');
                    if (target === "left-pane-handle") {
                        shown = env.resizeLeftHandPanel($dragging, x, $editor, $file, shown);
                        projectFileTree.perfectScrollbar('update');
                        buildLogHandler.perfectScrollbar('update');
                        env.resizeProjectFilesTree(projectFileTree);
                    } else if (target === 'build-log-handle') {
                        env.resizeBuildLogPane(y, buildLogHandler);
                    }
                }
            }).on('mouseup', function () {
                $dragging = null;
                target = "";
            });

            $('#left-pane-handle').on('mousedown', function (e) {
                $dragging = $(e.target);
                target = e.target.id;
                // verify shown is correct
                shown = e.pageX !== 0;
            }).on('dblclick', function () {
                const leftPane = $('#left-pane-handle');
                const handle = leftPane;
                shown = leftPane.offset().left > 5;
                var leftAmt;
                if (shown) {
                    leftAmt = 0;
                } else {
                    leftAmt = 0.3 * window.innerWidth;
                }
                shown = env.resizeLeftHandPanel(handle, leftAmt, $editor, $file, shown);
            });

            $('#project-files-handle').on("mousedown", function (e) {
                $dragging = $(e.target);
                target = e.target.id;
            });

            $('#build-log-handle').on('mousedown', function (e) {
                $dragging = $(e.target);
                target = e.target.id;
            });

            const normalizeEditorComponents = function () {
                // Normalize the editor to px from %
                const editorContainer = $('#editor-component-container');
                editorContainer.css('height', editorContainer.height() + 'px');
                const leftPane = $('#left-pane');
                env.resizeLeftHandPanel($('#left-pane-handle'), leftPane.width(), $editor, $file, true);
            };
            if (typeof less.pageLoadFinished !== 'undefined') {
                less.pageLoadFinished.then(normalizeEditorComponents);
            } else {
                normalizeEditorComponents();
            }
        },
        scrollbars: function setupCustomScrollbars() {
            const $perfect = $('[perfect-scrollbar]');
            $perfect.perfectScrollbar();
            $perfect.perfectScrollbar('update');
        },
        fonts: function setupFonts() {
            $('.editor-font').css('font-family', "'" + env.settings.get('font') + "', 'Source Code Pro', monospace");
            fetchRcInfoAndScaleText();
            $('#editor').flowtype({
                minFont: env.settings.get('fontSize'),
                maxFont: 36,
                fontRatio: 80
            });
        },
        tooltips: function setupToolTips() {
            env.waitForFtcRobotControllerDetect(function() {
                (env.whenFtcRobotController(function () {
                    $('[rc-title]').each(function() {
                        $(this).attr('title', $(this).attr('rc-title'));
                    });
                }, $.noop))();$('[data-toggle="tooltip"]').on('taphold', function (e) {
                const target = $(e.target);
                target.tooltip('show');
                setTimeout(function () {
                    target.tooltip('hide');
                }, 3000);
            }).tooltip();});
        },
        contextMenus: function setupContextMenus() {
            // Set up context menus
            $('#menu-container').on('contextmenu', function (e) {
                e.preventDefault();
            });
            $('#editor-toolbox').on('contextmenu', function (e) {
                e.preventDefault();
            });

            const $file = $('#file-tree');
            const nodeItemRequired = function (trigger) {
                if (typeof trigger === 'undefined' || typeof trigger === 'string') trigger = this;
                return typeof $(trigger).data('nodeid') === 'undefined';
            };
            const fetchNodeFromTreeViewDom = function (item) {
                const nodeId = fetchNodeIdFromTreeViewDom(item);
                return $file.treeview('getNode', nodeId);
            };
            var fetchNodeIdFromTreeViewDom = function (item) {
                return $(item).data('nodeid');
            };
            const getSelected = function () {
                return $file.treeview('getSelected', 0);
            };

            const requireSingleNodeSelected = function (trigger) {
                if (typeof trigger === 'undefined' || typeof trigger === 'string') trigger = this;
                return nodeItemRequired(trigger) || getSelected().length !== 1;
            };

            const requireOpenableNode = function(trigger) {
                var node = fetchNodeFromTreeViewDom(trigger);
                return node.folder || node.file.endsWith('.jar') || node.file.endsWith('.aar');
            };

            const isExternalLibrariesNode = function(node) {
              return node.folder && node.parentId === undefined && node.text == "ExternalLibraries";
            };
            const isExternalLibrariesItem = function(trigger) {
              return isExternalLibrariesNode(fetchNodeFromTreeViewDom(trigger));
            };
            const isInExternalLibrariesTree = function(trigger) {
              var node = fetchNodeFromTreeViewDom(trigger);
              while (node.parentId !== undefined) {
                node = $file.treeview('getNode', node.parentId);
              }
              return isExternalLibrariesNode(node);
            };

            var nodesToCopy = null;
            const markFilesToBeCut = function () {
                $('#file-tree').find('a[href]').each(function () {
                    var $this = $(this);
                    if ($this.attr('href') === 'javaScript:void(0);') {
                        $this.changeElementType('span');
                    }
                });
                if (nodesToCopy === null || typeof nodesToCopy.nodes === 'undefined' ||
                    typeof nodesToCopy.op === 'undefined' || nodesToCopy.op !== 'cut') {
                    return;
                }
                var nodes = nodesToCopy.nodes;
                nodes.forEach(function (node) {
                    var nodeId = node.nodeId;
                    $('#file-tree').find('li[data-nodeid=' + nodeId + ']').addClass('cut');
                });

            };
            const fileTreeUpdateObserver = new MutationObserver(markFilesToBeCut);
            //noinspection JSCheckFunctionSignatures
            fileTreeUpdateObserver.observe($file[0], {childList: true, subtree: true });
            $.contextMenu({
                // define which elements trigger this menu
                selector: "#file-tree-container, #file-tree li.list-group-item",
                // define the elements of the menu
                build: function ($trigger) {
                    if (!nodeItemRequired($trigger))
                        $file.treeview('selectNode', [fetchNodeIdFromTreeViewDom($trigger)]);

                    return {
                        items: {
                            open: {
                                name: 'Open',
                                icon: 'fa-pencil',
                                callback: function () {
                                    window.location = fetchNodeFromTreeViewDom(this).href;
                                },
                                disabled: function () {
                                    return nodeItemRequired(this) || requireOpenableNode(this);
                                }
                            },
                            new: {
                                name: 'New', icon: 'fa-plus', items: {
                                    folder: {
                                        name: 'Folder',
                                        icon: 'fa-folder',
                                        callback: function () {
                                            env.tools.newFolder();
                                        }
                                    },
                                    file: {
                                        name: 'File',
                                        icon: 'fa-file',
                                        callback: function () {
                                            env.tools.add();
                                        }
                                    }
                                }
                            },
                            rename: {
                                name: 'Rename', callback: function () {
                                    const selectedNode = fetchNodeFromTreeViewDom(this);
                                    var folder = selectedNode.folder;
                                    parent.showPrompt('Enter a new filename', selectedNode.file, function(newFileName) {
                                        if (newFileName === null) return;
                                        if (newFileName === selectedNode.file) return;
                                        // Warn a user if they change the file extension
                                        if (
                                            // Both files have a file extension
                                            (newFileName.indexOf(".") > -1 && selectedNode.file.indexOf(".") > -1) &&
                                            // And those extensions are not the same
                                            (
                                                newFileName.substring(newFileName.lastIndexOf(".")) !==
                                                selectedNode.file.substring(selectedNode.file.lastIndexOf("."))
                                            ) &&
                                            // and the user didn't confirm they wanted the op to happen
                                            !confirm(
                                                "You are about to rename a file to different file extension.\n" +
                                                "Are you sure you want to rename the file?"
                                            )
                                        ) {
                                            return;
                                        } else if (
                                            // The old file has a file extension and the new one doesn't
                                            (newFileName.indexOf(".") === -1 && selectedNode.file.indexOf(".") > -1)
                                        ) {
                                            var oldExt = selectedNode.file.substring(selectedNode.file.lastIndexOf(".") + 1)
                                            var possibleFix = newFileName + "." + oldExt;
                                            if (confirm(
                                                "You might have dropped the file extension with the rename.\n" +
                                                "Did you mean: " + possibleFix + "?"
                                            )) {
                                                newFileName = possibleFix;
                                            }
                                        }

                                        // Warn users about a behavior change in rename
                                        if (newFileName.indexOf("/") > -1) {
                                            var exampleFileName = newFileName.substring(newFileName.lastIndexOf("/") + 1);
                                            var exampleTo = selectedNode.parentFile + exampleFileName;
                                            if (folder) exampleTo += '/';
                                            if (confirm(
                                                "You no longer need to specify the full path of a file; rename will " +
                                                "move a file within the same folder.\n" +
                                                "This rename will move the file to: " + exampleTo + "\n" +
                                                "Do you want to rename the file still?"
                                            )) {
                                                newFileName = exampleFileName;
                                            } else {
                                                return;
                                            }
                                        }

                                        var to = selectedNode.parentFile + newFileName;
                                        if (folder) to += '/';
                                        if (env.trees.findInSourceFiles(to) === env.errors.FILE_NOT_DIRECTORY) {
                                            parent.confirm(
                                                "Error: Cannot rename this file, since we would that would " +
                                                "put a file inside a normal file"
                                            );
                                            return;
                                        } else if (env.trees.findInSourceFiles(to) !== env.errors.FILE_NOT_FOUND) {
                                            parent.confirm("Error: must select a unique new filename.");
                                            return;
                                        }
                                        env.tools.copyFiles({
                                            silent: true,
                                            callback: function (failed) {
                                                if (failed) {
                                                    alert('Failed to rename file "' + selectedNode.file + '"!');
                                                } else {
                                                    $file.treeview('selectNode', selectedNode);
                                                    env.tools.delete({
                                                        silent: true, callback: function (opDeletedSelf) {
                                                            env.setup.projectView();
                                                        }
                                                    });
                                                }
                                            },
                                            nodes: [selectedNode],
                                            to: to
                                        });
                                    });
                                },
                                disabled: function() {
                                    return requireSingleNodeSelected(this) || isInExternalLibrariesTree(this);
                                }
                            },
                            sep1: '---------',
                            cut: {
                                name: 'Cut', icon: 'fa-scissors', callback: function () {
                                    nodesToCopy = {
                                        nodes: getSelected(),
                                        op: 'cut'
                                    };
                                    env.tools._copy = nodesToCopy;
                                    markFilesToBeCut();
                                },
                                disabled: function() {
                                    return nodeItemRequired(this) || isInExternalLibrariesTree(this);
                                }
                            },
                            copy: {
                                name: 'Copy', icon: 'fa-files-o', callback: function () {
                                    nodesToCopy = {
                                        nodes: getSelected(),
                                        op: 'copy'
                                    };
                                    env.tools._copy = nodesToCopy;
                                },
                                disabled: function() {
                                    return nodeItemRequired(this) || isInExternalLibrariesTree(this);
                                }
                            },
                            paste: {
                                name: 'Paste', icon: 'fa-clipboard', callback: function () {
                                    const selectedNode = fetchNodeFromTreeViewDom(this);
                                    const newParentFile = selectedNode.parentFile +
                                        (selectedNode.folder ? selectedNode.file + '/' : '');
                                    const deleteAfterCopy = nodesToCopy.op === 'cut';
                                    nodesToCopy.op = 'copy';
                                    var deletedSelf = false;
                                    var results = [];
                                    var to;

                                    // Verify this operation can complete without an overwrite
                                    // Check the head of the tree to be copied, if any new folders need to be created
                                    // in an existing directory, we only need to check for conflicts between existing
                                    // files and the new files in the existing directory.
                                    for (var node of nodesToCopy.nodes) {
                                        var newFileName = newParentFile + node.file;
                                        if (node.folder) {
                                            newFileName += '/';
                                        }
                                        if (env.trees.findInSourceFiles(newFileName) === env.errors.FILE_NOT_DIRECTORY) {
                                            parent.confirm('You cannot create a folder inside a file. Try a different location.');
                                            return;
                                        } else if (env.trees.findInSourceFiles(newFileName) !== env.errors.FILE_NOT_FOUND) {
                                            var originalName = node.file;
                                            var ext = '';
                                            if (originalName.indexOf('.') >= 0) {
                                                ext = originalName.substring(originalName.lastIndexOf('.'));
                                                originalName = originalName.substring(0, originalName.lastIndexOf('.'));
                                            }
                                            var suffix = "_Copy";
                                            if (originalName.endsWith(suffix)) {
                                                suffix = "";
                                            }
                                            var dest = originalName + suffix + ext;
                                            var testFileName = newParentFile + dest;
                                            if (node.folder) {
                                                testFileName += '/';
                                            }
                                            for (
                                                var i = 2;
                                                i < 1000 &&
                                                env.trees.findInSourceFiles(testFileName) !== env.errors.FILE_NOT_FOUND;
                                                i++
                                            ) {
                                                dest = originalName + suffix + i + ext;
                                                testFileName = newParentFile + dest;
                                                if (node.folder) {
                                                    testFileName += '/';
                                                }
                                            }
                                            if (!parent.confirm(
                                                'OnBotJava is going to create a copy named ' + dest + ', otherwise ' +
                                                'this would overwrite an existing file. Do you still want to continue?'
                                            )) {
                                                return;
                                            }
                                        }
                                    }

                                    nodesToCopy.nodes.forEach(function(value) {
                                        to = newParentFile + value.file;
                                        if (value.folder) to += '/';

                                        var copyPromise = env.tools.copyFiles({ // copy file blocks until the operation is complete
                                            silent: true,
                                            callback: function (failed) {
                                                if (failed) {
                                                    alert('Failed to copy files!');
                                                } else {
                                                    if (deleteAfterCopy) {
                                                        $file.treeview('selectNode', value);
                                                        const deletePromise = env.tools.delete({
                                                            silent: true, callback: function (opDeletedSelf) {
                                                                if (!deletedSelf) deletedSelf = opDeletedSelf;
                                                            }
                                                        });
                                                        results.push(deletePromise);
                                                    }
                                                }
                                            },
                                            nodes: [value],
                                            to: to
                                        });

                                        results.push(copyPromise);
                                    });

                                    $.when.apply($, results).then(function () {
                                        if (deletedSelf) {
                                            if (nodesToCopy.nodes.length === 1) {
                                                const selectedNode = nodesToCopy.nodes[0];
                                                if (to.indexOf('/') !== 0) to = '/' + to;
                                                var newCurrentFileName = to;
                                                if (selectedNode.folder) { // check if we renamed a folder
                                                    newCurrentFileName = env.documentId.substr(
                                                        ('/' + selectedNode.parentFile + selectedNode.file).length + 1);
                                                    newCurrentFileName = to + newCurrentFileName;
                                                }
                                                window.location = env.javaUrlRoot + '/editor.html?' + newCurrentFileName;
                                            } else {
                                                window.location = env.javaUrlRoot + '/editor.html';
                                            }
                                        }

                                        env.setup.projectView();
                                    });
                                }, disabled: function () {
                                    return nodesToCopy === null || requireSingleNodeSelected(this) || isInExternalLibrariesTree(this);
                                }
                            },
                            sep2: '---------',
                            download: {
                                name: (function() {
                                    // we are not going to bother with type detection, because this is generated on the fly, so the new value
                                    // will eventually get to this point
                                    if (typeof env._isFtcRobotController === 'boolean') {
                                        return env.whenFtcRobotController('Copy File From OnBotJava', 'Download');
                                    } else {
                                        return 'Download';
                                    }
                                })(), icon: 'fa-download', callback: function () {
                                    var url;
                                    if (nodeItemRequired(this)) {
                                        url = env.urls.URI_FILE_DOWNLOAD + '?' + env.urls.REQUEST_KEY_FILE + '=/src/';
                                    } else {
                                        var selectedNode = fetchNodeFromTreeViewDom(this);
                                        url = env.urls.URI_FILE_DOWNLOAD + '?' + env.urls.REQUEST_KEY_FILE + '=/' + selectedNode.parentFile + selectedNode.file;
                                        if (selectedNode.folder) url += '/';
                                    }

                                    // This is used instead of window.open to support the REV Hardware Client
                                    var downloadUrl = $('#download-link');
                                    downloadUrl.attr('href', url);
                                    downloadUrl.prop('download', true)
                                    // Clicks are not correctly handled for the element using standard jQuery, send a click to the
                                    // HTML element instead
                                    downloadUrl[0].click();
                                },
                                disabled: function () {
                                    return isInExternalLibrariesTree(this);
                                }
                            },
                            delete: {
                                name: 'Delete', icon: 'fa-trash', callback: function () {
                                    env.tools.delete();
                                },
                                disabled: function() {
                                    return nodeItemRequired(this) || isExternalLibrariesItem(this);
                                }
                            }
                        }
                    };
                }
            });
        },
        langTools: function () {
            env.ftcLangTools = new FtcLangTools();
            env.ftcLangTools.autoImport.updateClassToPackageMap();
        },
        keyboardShortcuts: function () {
            var debug = false;

            env.keys.monitorKeyCombo(['ctrl', 'space'], function () {
                if (!env.debug) return;
                var stringify = 'Current type under cursor: ' + JSON.stringify(env.ftcLangTools.detectTypeUnderCursor());
                if (debug) {
                    var token = env.ftcLangTools.tokenUnderCursor();
                    if (token !== null) {
                        var currentLine = token.line;
                        var currentIndex = token.index;
                        var startIndex = currentIndex;
                        var currentTokens = env.ftcLangTools.currentTokens;
                        for (; startIndex >= 0 && currentTokens[startIndex].line === currentLine; startIndex--) {}
                        for (; currentIndex < currentTokens.length && currentTokens[currentIndex].line === currentLine; currentIndex++) {}
                        var tokensForCurrentLine = currentTokens.slice(startIndex, currentIndex);
                        stringify += '\nCurrent tokens on line: ';
                        stringify += JSON.stringify(tokensForCurrentLine);
                    }
                }
                alert(stringify);
            });

            env.keys.monitorKeyCombo(['ctrl','alt','space'], function () {
                if (!env.debug) return;

                debug = !debug;
            });
        },
        teamInformation: function () {
            loadRcInfo(function (rcInfo) {
                env.deviceName = rcInfo.deviceName;
                const defaultTeamPrefix = 'FIRST Tech Challenge Team ';
                env.teamName = defaultTeamPrefix + env.deviceName.substr(0, env.deviceName.indexOf('-'));
                if (env.teamName === defaultTeamPrefix) { // the team does not have a valid RC name, so we can't calculate the team name
                    env.teamName = '';
                }
            });
        },
        print: function () {
            // From https://www.tjvantoll.com/2012/06/15/detecting-print-requests-with-javascript/
            // Accessed on 8/3/2017
            (function() {
                var beforePrint = function() {
                    const $print = $('#print-container');
                    if (!$print.hasClass('ace-' + env.editorTheme)) {
                        $print.addClass('ace-' + env.editorTheme);
                    }

                    const $layer = $print.find('.ace_layer.ace_text-layer');
                    $layer.html('');
                    const session = env.editor.session;
                    for (var i = 0; i < session.getLength(); i++) {
                        const $line = $('<div />').addClass('ace_line');
                        const tokens = session.getTokens(i);
                        tokens.forEach(function(value) {
                            if (value.type === 'text') {
                                $line.append(value.value);
                            } else {
                                $('<span />', {
                                    "class": (function () {
                                        var classes = '';
                                        value.type.split('.').forEach(function(type) {
                                            classes += 'ace_' + type + ' ';
                                        });

                                        return classes;
                                    }),
                                    text: value.value
                                }).appendTo($line);
                            }
                        });

                        // force an empty line during print if there is supposed to be an empty line
                        if (tokens.length === 0) {
                            $line.html('<br />');
                        }

                        $layer.append($line);
                    }
                };

                if (window.matchMedia) {
                    var mediaQueryList = window.matchMedia('print');
                    mediaQueryList.addListener(function(mql) {
                        if (mql.matches) {
                            beforePrint();
                        }
                    });
                }

                window.onbeforeprint = beforePrint;
            }());
        },
         // Should only be called when app.js is ready
         displayOnBotJava: function () {
             $('#page-load-container').css('display', 'none');
             $('#editor-container').css('visibility', 'visible');
         },
        websocket: function() {
            WEBSOCKET_LIB.webSocketManager.subscribeToNamespace(env.urls.WS_NAMESPACE);
            env.ws = {
                send: function sendOnBotJavaWsMessage(type, msg) {
                    WEBSOCKET_LIB.webSocketManager.sendMessage(new WEBSOCKET_LIB.WebSocketMessage(env.urls.WS_NAMESPACE, type, msg));
                },
                register: function registerOnBotJavaWsHandler(type, handler) {
                    WEBSOCKET_LIB.webSocketManager.registerTypeHandler(env.urls.WS_NAMESPACE, type, handler);
                },
                connectionHandlers: function registerOnBotJavaConnectionHandlers(onConnect, onDisconnect) {
                    WEBSOCKET_LIB.webSocketManager.registerConnectionStateListeners(onConnect, onDisconnect);
                }
            }
        }
    };

    env.keys = (function () {
        const keys = {
            monitorKey: function monitorKey(keyCode, keyName) {
                keys[keyName] = {
                    pressed: false,
                    code: keyCode
                };
                keys.monitoredKeys.push(keyName);
            },
            monitorKeyCombo: function (keysInCombo, callback) {
                if (!Array.isArray(keysInCombo) || typeof callback !== 'function') return false;
                keys.keyCombos.push({keys: keysInCombo, callback: callback});
                return true;
            },
            monitoredKeys: [],
            keyCombos: [],
            numberOfKeysPressed: 0
        };

        function normalizeModifierKey(key, isPressed, down) {
            if (isPressed === down && key.pressed !== down) {
                key.pressed = isPressed;
                if (down) {
                    keys.numberOfKeysPressed++;
                } else {
                    keys.numberOfKeysPressed--;
                }
            }
        }

        $(window).on('keydown', function (evt) {
            // Normalize the modifiers key, in case we have not received the keydown events
            normalizeModifierKey(keys.ctrl, evt.ctrlKey, true);
            normalizeModifierKey(keys.alt, evt.altKey, true);
            normalizeModifierKey(keys.shift, evt.shiftKey, true);

            for (var i = 0; i < keys.monitoredKeys.length; i++) {
                var key = keys.monitoredKeys[i];
                if (key === 'ctrl' || key === 'alt' || key === 'shift') continue;
                // todo: change evt.which to evt.key, when evt.key support is better
                if (evt.which === keys[key].code) {
                    keys[key].pressed = true;
                    keys.numberOfKeysPressed++;
                    break;
                }
            }

            for (var j = 0; j < env.keys.keyCombos.length; j++) {
                var combo = env.keys.keyCombos[j];
                var isValidCombo = true;

                for (var k = 0; k < keys.monitoredKeys.length; k++) {
                    var testKey = keys.monitoredKeys[k];
                    var indexOfComboKey = combo.keys.indexOf(testKey);
                    if ((indexOfComboKey < 0 && keys[testKey].pressed) || // key not wanted
                        (indexOfComboKey >= 0 && !keys[testKey].pressed)) { // wanted key
                        isValidCombo = false;
                        break;
                    }
                }

                if (isValidCombo) {
                    combo.callback(evt);
                    break;
                }
            }
        });

        $(window).on('keyup', function (evt) {
            for (var i = 0; i < keys.monitoredKeys.length; i++) {
                var key = keys.monitoredKeys[i];
                if (!keys.hasOwnProperty(key) || typeof keys[key] !== 'object' ||
                    key === 'ctrl' || key === 'alt' || key === 'shift') continue;
                if (evt.which === keys[key].code) {
                    keys[key].pressed = false;
                    keys.numberOfKeysPressed--;
                    break;
                }
            }

            // Normalize the modifiers key, in case we have not received the keyup events
            normalizeModifierKey(keys.ctrl, evt.ctrlKey, false);
            normalizeModifierKey(keys.alt, evt.altKey, false);
            normalizeModifierKey(keys.shift, evt.shiftKey, false);
        });

        keys.monitorKey(16, 'shift');
        keys.monitorKey(17, 'ctrl');
        keys.monitorKey(18, 'alt');
        keys.monitorKey(32, 'space');
        keys.monitorKey(13, 'enter');
        return keys;
    })();

    env.screen = (function (env) {
        env.screen = {};
        const currentWidth = function () {
            env.screen.width = $(window).width();
            return env.screen.width;
        };
        const currentHeight = function () {
            env.screen.height = $(window).height();
            return env.screen.height;
        };
        return {
            currentWidth: currentWidth,
            currentHeight: currentHeight,
            height: currentHeight(),
            width: currentWidth()
        };
    })(env);

    // Start everything up
    (function init() {
        env.setup.langTools();
        env.setup.windowHandles();
        env.setup.scrollbars();
        env.setup.fonts();
        env.setup.projectView();
        env.setup.tooltips();
        env.setup.contextMenus();
        env.setup.teamInformation();
        env.setup.keyboardShortcuts();
        env.setup.print();
        env.setup.websocket();
    })();
})(env, jQuery, console);
