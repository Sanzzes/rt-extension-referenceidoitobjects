(function($) {
    browser_preselection_field = $(browser_preselection_field);
	browser_mandator_field = $(browser_mandator_field);

    // Initialize the data table.
    var objectview_table = $('#i-doit-objectbrowser #tab-objectview table.object-table').dataTable({
        "bJQueryUI": true,
        "bAutoWidth": false,
        "bLengthChange": false,
        "iDisplayLength": 20,
        "sPaginationType": "full_numbers",
        "oLanguage": datatable_lang
    }),
    itemview_table = $('#i-doit-objectbrowser #tab-itemview table.object-table').dataTable({
        "bJQueryUI": true,
        "bAutoWidth": false,
        "bPaginate": false,
        "bLengthChange": false,
        "bSort": false,
        "oLanguage": datatable_lang
    });

    /**
     * This event will initialize the browser.
     *
     * @author  Leonard Fischer <lfischer@synetics.de>
     */
    window.init_browser = function() {
		api_mandator = browser_mandator_field.val();
		if (api_mandator == 0 || api_mandator == "") {
			$('#i-doit-browser-notice').html(objectbrowser_lang.LC_PLEASE_SELECT_MANDATOR);
			initialized = false;
			return;
		}

		initialized = true;
		$('#i-doit-browser-notice').css({display: 'none'});
		$('#i-doit-objectbrowser-content').css({display: 'block'});

		// Here we get our preselection data and cast the ID's to integer.
		var data = {};

		// We look if the preselection field is filled.
		window.load_preselection_data();

		// Here we load the requestor data (workplaces and assigned objects).
		window.load_requestor_data();

		data = {
			"method":"cmdb.object_types",
			"params":{
				"session":{
					"username":api_user,
					"password":api_password,
					"language":api_lang,
					"mandator":api_mandator},
                "order_by":"title"},
			"id":"1",
			"jsonrpc":"2.0"};

		idoit_ajax(data, function(response) {
			if (response.error == null) {
				$('#i-doit-objectbrowser select.object-type').html('');
				$.each(response.result, function(i, e) {
					$('<option value="' + e.id + '">' + e.title + '</option>').appendTo('#i-doit-objectbrowser select.object-type');
				});

				// Trigger the event.
				$('#i-doit-objectbrowser select.object-type').change();
			} else {
				window.error_notice('Error while loading object-types.');
			}
		});
    };

    /**
     * Callback function for selecting an object-type.
     *
     * @author  Leonard Fischer <lfischer@synetics.de>
     */
    $('#i-doit-objectbrowser select.object-type').change(function() {
		window.display_loading();
        var data = {
            "method":"cmdb.objects",
            "params":{
                "session":{
                    "username":api_user,
                    "password":api_password,
                    "language":api_lang,
                    "mandator":api_mandator},
                "filter":{
                    "type":parseInt(this.value)},
                "order_by":"title"},
            "id":"1",
            "jsonrpc":"2.0"};

        idoit_ajax(data, function(response) {
            if (response.error == null) {
				window.remove_loading();
                // Clear the table from our old entries.
                current_objectview_data = response.result;
                window.render_objectview();
            } else {
                window.error_notice('Error while loading objects by object-type');
            }
        });
    });

    /**
     * This event will store the added ID's from the object-view.
     *
     * @author  Leonard Fischer <lfischer@synetics.de>
     */
    $('input[name="i-doit-objectbrowser-obj[]"]').live('change', function() {
        if ($(this).attr('checked')) {
            var name = $(this).closest('tr').find('td:eq(2)').text(),
                type = $('#i-doit-objectbrowser select.object-type option:selected').text();

            window.add_object($(this).val(), name, type);
        } else {
            window.remove_object($(this).val());
        }
    });

    /**
     * This event will store the added ID's from the tree-view.
     *
     * @author  Leonard Fischer <lfischer@synetics.de>
     */
    $('input[name="i-doit-treebrowser-obj[]"]').live('change', function() {
        if ($(this).attr('checked')) {
            var name = $(this).next().text(),
                type = $(this).next().next().text();

            window.add_object($(this).val(), name, type);
        } else {
            window.remove_object($(this).val());
        }
    });

    /**
     * Function for loading the requestor - This can be used if a new requestor has been added to the "Requestor" field.
     *
     * @author  Leonard Fischer <lfischer@synetics.de>
     */
    $('#requestor-reload').click(function() {
        window.load_requestor_data();
    });


	/**
	 * Function for reloading the requestors - This will be fired when a new requestor is beeing added to the "Requestor" field.
	 *
	 * @author  Leonard Fischer <lfischer@synetics.de>
	 */
	$('#Requestors').live('change', function() {
		if (initialized) window.load_requestor_data();
	});


	/**
	 * Function for reloading the preselection - This will be fired when the preselection field is beeing changed.
	 *
	 * @author  Leonard Fischer <lfischer@synetics.de>
	 */
	browser_preselection_field.live('change', function() {
		if (initialized) window.load_preselection_data();
	});

    /**
     * Loads and displays the requestor-data (workplace, assigned objects, ...).
     *
     * @author  Leonard Fischer <lfischer@synetics.de>
     */
	window.load_requestor_data = function() {
		requestors = $('#Requestors').val();

		if (typeof requestors == 'string') {
			requestors = requestors.replace(/(\s)/g, '').split(',');
		}

		if (typeof requestors != 'undefined') {
			if (requestors.length > 0) {
				window.display_loading();
				data = {
					"method":"cmdb.workstation_components",
					"params":{
						"session":{
							"username":api_user,
							"password":api_password,
							"language":api_lang,
							"mandator":api_mandator},
						"filter":{
							"emails":requestors}},
					"id":"1",
					"jsonrpc":"2.0"};

				idoit_ajax(data, function(response) {
					// First we check for errors.
					window.remove_loading();

					if (response.error == null) {
						current_treeview_data = response.result;
						window.render_treeview();
					} else {
						window.error_notice('Error while loading objects by email.');
					}
				});
			}
		}
	};

	/**
	 * Loads and displays the preselection-data.
	 *
	 * @author  Leonard Fischer <lfischer@synetics.de>
	 */
	window.load_preselection_data = function() {
		var preselection = browser_preselection_field.val();

		if (typeof preselection != 'undefined') {
			preselection = preselection.split("\n")

			if (preselection != '') {
				preselection = preselection.map(function(i) {
					return (!isNaN(parseInt(i)) ? parseInt(i) : 0);
				});

				if (preselection.length > 0) {
					window.display_loading();
					// We first request the preselected ID's so we can display them correctly inside the "selected objects" list (ID, Name, Type).
					data = {
						"method":"cmdb.objects",
						"params":{
							"session":{
								"username":api_user,
								"password":api_password,
								"language":api_lang,
								"mandator":api_mandator},
							"filter":{
								"ids":preselection}},
						"id":"1",
						"jsonrpc":"2.0"};

					idoit_ajax(data, function(response) {
							window.remove_loading();
							if (response.error == null) {
								window.remove_all_objects();

								$.each(response.result, function(i, e) {
									window.add_object(e.id, e.title, e.objecttype);
								});
							} else {
								window.error_notice('Error while preselecting objects.');
							}
						});
				}
			}
        }
    };


	/**
	 * Event for initializing the object browser, when changing the mandator.
	 *
	 * @author  Leonard Fischer <lfischer@synetics.de>
	 */
	browser_mandator_field.live('change', function() {
		api_mandator = browser_mandator_field.val();
		window.remove_all_objects();
		window.init_browser();
	});


	/**
	 * This function is used to render the tree view. This is needed to update the selected ID's.
	 *
	 * @author  Leonard Fischer <lfischer@synetics.de>
	 */
    window.render_treeview = function() {
        $('#tab-treeview div').html('');
		
        // We iterate through the first level (email-addresses).
        $.each(current_treeview_data, function(i, e) {
            $('#tab-treeview div.workplaces').append('<a href="' + idoit_url + '?objID=' + i + '"><b>' + e.data.title + '</b></a><br />');

			if (e.children != false) {
				window.render_treeview_recursion(e.children, 1);
			}
			
			$('#tab-treeview div.workplaces').append('<br />');
        });
    };
	
	
	window.render_treeview_recursion = function(data, level) {
		$.each(data, function(i, e) {
			var selected = false;
			if (typeof $('#data-store').data(i) != 'undefined') {
				selected = true;
			}
		
			var output = '<div><input type="checkbox" value="' + i + '" name="i-doit-treebrowser-obj[]" ' + ((selected) ? 'checked="checked"' : '') + ' style="margin-left:' + (level * 20) + 'px;"> ' +
				'<span class="obj-name">' + e.data.title + '</span>' +
				' (<span class="obj-type">' + e.data.type_title + '</span>) ' + 
				'<span class="relation-button">&raquo; Softwarebeziehungen</span></div>';
				
			$('#tab-treeview div.workplaces').append(output);
			
			if (e.children != false) {
				window.render_treeview_recursion(e.children, (level + 1));
			}
		});
	};
	
	
	$('span.relation-button').live('click', function() {
		window.display_loading();
		
		var id = $(this).prev().prev().prev().val(),
			div = $(this).parent();
		
		data = {
			"method":"cmdb.objects_by_relation",
			"params":{
				"session":{
					"username":api_user,
					"password":api_password,
					"language":api_lang,
					"mandator":api_mandator},
				"id":id,
				"relation_type":"C__RELATION_TYPE__SOFTWARE"},
			"id":"1",
			"jsonrpc":"2.0"};

		idoit_ajax(data, function(response) {
				window.remove_loading();
				if (response.error == null) {
					$.each(response.result, function(i, e) {
						div.append(i + '<br />');
					});
				} else {
					window.error_notice('Error while loading relation objects.');
				}
			}.bind(this));
	});
	
	

    /**
     * Function for rendering the object-table.
     *
     * @author  Leonard Fischer <lfischer@synetics.de>
     */
    window.render_objectview = function() {
        objectview_table.fnClearTable();
        $.each(current_objectview_data, function(i, e) {
            if (e.status == 2) {
                var check,
					selected = false,
					title,
					id;

                if (typeof $('#data-store').data(e.id) != 'undefined') {
                    selected = true;
                }

                check = '<input type="checkbox" value="' + e.id + '" name="i-doit-objectbrowser-obj[]" ' + ((selected) ? 'checked="checked"' : '') + ' />';
                id = e.id;
				title = '<a href="' + idoit_url + '?objID=' + e.id + '">' + e.title + '</a>';
                objectview_table.fnAddData([check, id, title]);
            }
        });
    };

    /**
     * Function for removing an item from the selected data.
     *
     * @param   integer  id  The object-id to remove from our selection.
     * @author  Leonard Fischer <lfischer@synetics.de>
     */
    window.remove_object = function(id) {
        $('#data-store').removeData(id);

        window.render_selected_items();

		// Instead of rendering the lists new, we can to something like this:
		$('input[name="i-doit-objectbrowser-obj[]"][value="' + id + '"]').attr('checked', false);
		$('input[name="i-doit-treebrowser-obj[]"][value="' + id + '"]').attr('checked', false);
	};


	/**
	 * Function for removing all items from the selected data.
	 *
	 * @author  Leonard Fischer <lfischer@synetics.de>
	 */
	window.remove_all_objects = function() {
		$('#data-store').removeData();

		window.render_selected_items();
        window.render_objectview();
        window.render_treeview();
    };

    /**
     * Function for removing an item from the selected data.
     *
     * @param   integer  id    The object-id.
     * @param   string   name  The object-title.
     * @param   integer  type  The object-type.
     * @author  Leonard Fischer <lfischer@synetics.de>
     */
    window.add_object = function(id, name, type) {
        $('#data-store').data(id, {"name": name, "type": type});

        window.render_selected_items();

			// Instead of rendering the tables new, we can to something like this:
			$('input[name="i-doit-objectbrowser-obj[]"][value="' + id + '"]').attr('checked', 'checked');
			$('input[name="i-doit-treebrowser-obj[]"][value="' + id + '"]').attr('checked', 'checked');
    };

    /**
     * Function for rendering the "selected objects" list. Will be used when adding or removing an object.
     *
     * @author  Leonard Fischer <lfischer@synetics.de>
     */
    window.render_selected_items = function() {
        var data_array = [];

        itemview_table.fnClearTable();
        $.each($('#data-store').data(), function(i, e) {
			var title = '<a href="' + idoit_url + '?objID=' + i + '">' + e.name + '</a>';

			itemview_table.fnAddData(['<span class="i-doit-objectbrowser-remover" onclick="window.remove_object(' + i + ')">Entfernen</span>', i, title, e.type]);
            data_array.push(i);
        });

        browser_preselection_field.val(data_array.join("\n"));
    };

    /**
     * Function for sending requests to idoit.
     *
     * @param   json      data      A json-object with the data, you want to send with the request.
     * @param   function  callback  A callback to assign to the "success" of an request.
     * @author  Leonard Fischer <lfischer@synetics.de>
     */
    window.idoit_ajax = function(data, callback) {
        $.ajax({
            url: api_url,
            data: JSON.stringify(data),
            contentType: 'application/json',
            type: 'POST',
            dataType: 'json',
            success: callback
        });
    };


	/**
	 * You may implement an own method to display errors here.
	 *
	 * @param   string  msg  The error message.
	 * @author  Leonard Fischer <lfischer@synetics.de>
	 */
    window.error_notice = function(msg) {
		var notice = $('<div></div>').addClass('ui-corner-all').css({background: '#FFB1AD', borderColor: '#FF6D68', color: '#A04341'}).html(msg);
        $('#i-doit-browser-notice').after(notice);
		notice.slideDown(300).delay(2000).slideUp(300).delay(300).remove();
    }


	/**
	 * Function for displaying the "loading" screen.
	 *
	 * @author  Leonard Fischer <lfischer@synetics.de>
	 */
	window.display_loading = function() {
		$('#loading-screen').stop().fadeTo(300, 1);
		$('#i-doit-objectbrowser-content').stop().fadeTo(300, 0.3);
	}


	/**
	 * Function for removing the "loading" screen.
	 *
	 * @author  Leonard Fischer <lfischer@synetics.de>
	 */
	window.remove_loading = function() {
		$('#loading-screen').stop().fadeTo(300, 0);
		$('#i-doit-objectbrowser-content').stop().fadeTo(300, 1);
	}

    // Load default mandator:
    if (api_default_mandator >= 0) {
        browser_mandator_field.selected = api_default_mandator;
    }

	// Hide custom fields:
    if (show_custom_fields == 0) {
        browser_preselection_field.parent().parent().hide();
        browser_mandator_field.parent().parent().hide();
    }

	// Initialize our data object.
	$('#data-store').data();

	// Initialize our tabs.
	$('#i-doit-objectbrowser-content').tabs({selected: api_default_view});

	// Start the browser.
	window.init_browser();
})(jQuery);