// ==UserScript==
// @name           MyFitnessPal Leangains
// @version        1.0
// @namespace      osuvaldo
// @description    Different goals for work/rest days
// @include http://www.myfitnesspal.com/food/diary/* 
// @include https://www.myfitnesspal.com/food/diary/*
// @include http://www.myfitnesspal.com/food/diary
// @include https://www.myfitnesspal.com/food/diary
// @require https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
// @require https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.js
// ==/UserScript==

(function($)
{
	$('\
		<div>\
			<div>\
				<input type="checkbox" id="leangains_workout_day" />\
				<label for="leangains_workout_day">Is today a workout day?</label>\
			</div>\
			<div>\
				<a id="leangains_settings_a">Leangains Settings</a>\
				<div id="leangains_settings_dialog" hidden="true">\
					<p>Rest Day Macros</p>\
					<p><label>Protein: <input id="leangains_rest_protein" type="number" />g</label></p>\
					<p><label>Carbs: <input id="leangains_rest_carbs" type="number" />g</label></p>\
					<p><label>Fat: <input id="leangains_rest_fat" type="number" />g</label></p>\
					<p>Work Day Macros</p>\
					<p><label>Protein: <input id="leangains_work_protein" type="number" />g</label></p>\
					<p><label>Carbs: <input id="leangains_work_carbs" type="number" />g</label></p>\
					<p><label>Fat: <input id="leangains_work_fat" type="number" />g</label></p>\
				</div>\
			</div>\
		</div>\
	').insertBefore($('div.diary'));

	var rest_protein_input = $('#leangains_rest_protein');
	var rest_carbs_input= $('#leangains_rest_carbs');
	var rest_fat_input= $('#leangains_rest_fat');
	var work_protein_input= $('#leangains_work_protein');
	var work_carbs_input= $('#leangains_work_carbs');
	var work_fat_input= $('#leangains_work_fat');

	var rest_protein = localStorage.getItem('leangains_rest_protein');
	var rest_carbs = localStorage.getItem('leangains_rest_carbs');
	var rest_fat = localStorage.getItem('leangains_rest_fat');
	var work_protein = localStorage.getItem('leangains_work_protein');
	var work_carbs = localStorage.getItem('leangains_work_carbs');
	var work_fat = localStorage.getItem('leangains_work_fat');

	var workout_day = $('#leangains_workout_day');
	var date_storage = 'leangains_workout_day_' + $('#date_selector').val();
	var workout_day_storage = localStorage.getItem(date_storage);
	var is_workout_day = workout_day_storage !== null && workout_day_storage == "true";
	workout_day.prop('checked', is_workout_day);

	var rows = $('.food_container tr');

	function update()
	{
		var calories_i,
	        carbs_i,
	        fat_i,
	        protein_i,
	        fiber_i;

        rest_protein_input.val(localStorage.getItem('leangains_rest_protein'));
		rest_carbs_input.val(localStorage.getItem('leangains_rest_carbs'));
		rest_fat_input.val(localStorage.getItem('leangains_rest_fat'));
		work_protein_input.val(localStorage.getItem('leangains_work_protein'));
		work_carbs_input.val(localStorage.getItem('leangains_work_carbs'));
		work_fat_input.val(localStorage.getItem('leangains_work_fat'));

		function findIndices(index)
	    {
	        var text = $(this).text().toLowerCase();
	        if (text == 'fat') fat_i = index;
	        if (text == 'protein') protein_i = index;
	        if (text == 'fiber') fiber_i = index;
	        if (text == 'calories') calories_i = index;
	        if (text == 'carbs') carbs_i = index;
	    }

		rows.eq(-1).find('td').each(findIndices);

		var calories_total,
			protein_total,
			carbs_total,
			fat_total,
			calories_goal,
			protein_goal,
			carbs_goal,
			fat_goal;

		rows.filter('.total:not(tfoot tr)').each(function ()
		{
			var row = $(this);
			var change_function = getTotals;

			function getTotals(index)
			{
				var col = $(this);
            	var num = parseInt(col.text().replace(/,/g, ''), 10);

            	if (index == calories_i) calories_total = num;
            	if (index == protein_i) protein_total = num;
            	if (index == carbs_i) carbs_total = num;
            	if (index == fat_i) fat_total = num;
			}

			function setGoals(index)
			{
				protein_goal = is_workout_day ? work_protein : rest_protein;
		        carbs_goal = is_workout_day ? work_carbs : rest_carbs;
		        fat_goal = is_workout_day ? work_fat : rest_fat;
		        calories_goal = 4 * protein_goal + 4 * carbs_goal + 9 * fat_goal;

				var col = $(this);
				if (index == calories_i) col.text(calories_goal);
				if (index == protein_i) col.text(protein_goal);
				if (index == carbs_i) col.text(carbs_goal);
				if (index == fat_i) col.text(fat_goal);
			}

			function updateRemainders(index)
			{
				var goal, total;

				if (index == calories_i)
				{
					goal = calories_goal;
					total = calories_total;
				}
				else if (index == protein_i)
				{
					goal = protein_goal;
					total = protein_total;
				}
				else if (index == carbs_i)
				{
					goal = carbs_goal;
					total = carbs_total;
				}
				else if (index == fat_i)
				{
					goal = fat_goal;
					total = fat_total;
				}
				else return;

				var remainder = goal - total;
				var col = $(this);
				col.text(remainder);
				col.removeClass();
				if (remainder >= 0) col.addClass("positive");
				else col.addClass("negative");
			}

			if (row.hasClass('alt'))
			{
				change_function = setGoals;
			}
			else if (row.hasClass('remaining'))
			{
				change_function = updateRemainders;
			}

			row.find('td').each(change_function);
		});

		// do meal/food percentages
		rows.filter('tbody tr:not(.total, .meal_header, .spacer)').each(function ()
		{
			var calories,
				protein,
				carbs,
				fat;

			var calories_td,
				protein_td,
				carbs_td,
				fat_td;

			var row = $(this);

			var daily_pre = '<div class="myfp_us" style="color:#0a0;font-size:9px;">';
			var post = '</div>';
			var meal_pre = '<div class="myfp_us" style="color:#0aa;font-size:9px;">';

			row.find('td').each(function (index)
			{
				var col = $(this);
        		var num = parseInt(col.text().replace(/,/g, ''), 10);
    			debugger;
				if (index == calories_i)
				{
					calories = num;
					calories_td = col;
				}
				if (index == protein_i)
				{
					protein = num;
					protein_td = col;
				}
				if (index == carbs_i)
				{
					carbs = num;
					carbs_td = col;
				}
				if (index == fat_i)
				{
					fat = num;
					fat_td = col;
				}

				if (row.hasClass('bottom') && col.hasClass('first'))
				{
					

					col.html(col.html() + daily_pre + 'Percent of Daily Goal' + post + meal_pre
						+ 'Percent of Meal Calories' + post);
				}
			});

			var percent_post = '%</div>';

			var calories_percent = (calories / calories_goal * 100).toFixed(0);
			if (!isNaN(calories_percent))
			{
				calories_td.html(calories_td.html() + daily_pre + calories_percent + percent_post);

				var protein_percent = (protein / protein_goal * 100).toFixed(0);
				protein_td.html(protein_td.html() + daily_pre + protein_percent + percent_post);

				var carbs_percent = (carbs / carbs_goal * 100).toFixed(0);
				carbs_td.html(carbs_td.html() + daily_pre + carbs_percent + percent_post);

				var fat_percent = (fat / fat_goal * 100).toFixed(0);
				fat_td.html(fat_td.html() + daily_pre + fat_percent + percent_post);

				if (row.hasClass('bottom'))
				{
					var protein_meal_percent = (protein * 4 / calories * 100).toFixed(0);
					protein_td.html(protein_td.html() + meal_pre + protein_meal_percent + percent_post);

					var carbs_meal_percent = (carbs * 4 / calories * 100).toFixed(0);
					carbs_td.html(carbs_td.html() + meal_pre + carbs_meal_percent + percent_post);

					var fat_meal_percent = (fat * 4 / calories * 100).toFixed(0);
					fat_td.html(fat_td.html() + meal_pre + fat_meal_percent + percent_post);
				}
			}
		});
	}
	update();

	workout_day.change(function ()
	{
		is_workout_day = this.checked;
		localStorage.setItem(date_storage, this.checked);
		update();
	});

	$('#leangains_settings_a').click(function ()
	{
		$('#leangains_settings_dialog').dialog
		({
			//modal: true,
			title: "Leangains Settings",
			dialogClass: 'no-close',
			buttons:
			[
				{
					text: "Save",
					click: function ()
					{
						rest_protein = rest_protein_input.val();
						rest_carbs = rest_carbs_input.val();
						rest_fat = rest_fat_input.val();
						work_protein = work_protein_input.val();
						work_carbs = work_carbs_input.val();
						work_fat = work_fat_input.val();

						localStorage.setItem('leangains_rest_protein', rest_protein);
						localStorage.setItem('leangains_rest_carbs', rest_carbs);
						localStorage.setItem('leangains_rest_fat', rest_fat);
						localStorage.setItem('leangains_work_protein', work_protein);
						localStorage.setItem('leangains_work_carbs', work_carbs);
						localStorage.setItem('leangains_work_fat', work_fat);

						update();

						$(this).dialog("close");
					}
				},
				{
					text: "Cancel",
					click: function ()
					{
						$(this).dialog("close");
					}
				}
			]
		});
		$('.no-close .ui-dialog-titlebar-close').css("display", "none");
	});
})(jQuery);