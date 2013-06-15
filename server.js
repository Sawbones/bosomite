var express = require('express');
var crypto = require('crypto');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server, { log : false});
var mongo = require('./DBAPI.js');
var template = require('./template.js');

//HANDLEBARS
var handlebars = require('handlebars');
var fs = require('fs');

mongo.open(function(error, res){
	server.listen(8887);
});

//Set to use body parser middleware
app.use(express.static(__dirname + '/static'));
app.use(express.bodyParser());

app.get('/', function (req, res) {
	res.redirect('/drink/listing');
});

/*
	/drink/listing controller
*/
app.get('/drink/listing', function (req, res){
	mongo.find("drink", {}, function(data){
		var url = __dirname + '/static/drink/listing.html';
		res.send( template.render(url, { view_data : data }) );
	}, {});
});

/*
	/drink/add controller
*/
app.get('/drink/add', function (req, res){
	res.sendfile(__dirname + '/static/drink/add.html');

});

app.post('/drink/add', function(req, res){
	var name = req.param('name', null);
	var description = req.param('description', null);
	
	var ingredients = new Array();
	var count = 1, ingred = null;
	
	while( (ingred = req.param(('ingredient' + count), null)) != null )
	{
		ingredients.push(ingred);
		count += 1;
	}

	//Add these to the database if all are not null
	if(name != null && description != null && ingredients.length > 0)
	{
		var data = { 
			name : name, 
			description : description, 
			ingredients : ingredients 
		};

		mongo.insert("drink", data, function(error){});
		res.redirect("/drink/add");
	}
	else
	{
		res.send("One or more of the field were null: " + name + " " + description);
	}
});
/*
app.get('/drink/clean', function(req, res){
	Array.prototype.remove = function(from, to) {
		var rest = this.slice((to || from) + 1 || this.length);
		this.length = from < 0 ? this.length + from : from;
		return this.push.apply(this, rest);
	};
	var cleanHtml = fs.readFileSync('static/drink/clean.html');
	var template = handlebars.compile(cleanHtml.toString());

	mongo.find("drink", {}, function(result){
		var drinks = result.data;

		for(var i = 0; i < drinks.length; i++)
		{
			for(var j = 0; j < drinks[i].ingredients.length; j++)
			{
				if(drinks[i].ingredients[j] == "")
				{
					drinks[i].ingredients.remove(j)
				}
			}

			mongo.save("drink", drinks[i], function(){});
		}

		res.send( template({ drinks : drinks }) );
	}, {});
});
*/

/*
	CODE FOR WEBSOCKETS
*/
io.sockets.on('connection', function(socket){

	socket.on('drink/random_client', function(data){
		mongo.random("drink", null, function(error, data){

			//grabs the first element in the data array to simplify what gets passed to the client
			socket.emit('drink/random_server', { data : data[0] });
		});
	});

	socket.on('drink/random_ingredients_client', function(data){
		mongo.count("drink", function(count){

			//Doesnt let the skip get larger than the count - limit
			var limit = 3;
			var randomSkip = Math.floor((Math.random() * count) + 1);

			if(randomSkip > count - limit)
			{
				randomSkip = count - limit;
			}

			mongo.find("drink", {}, function(data){
				var ingredients = new Array();
				for(var i = 0; i < data.data.length; i+=1)
				{
					var drink = data.data[i].ingredients;
					var pickRandom = Math.floor((Math.random() * (drink.length - 1)) + 1);
					ingredients.push(data.data[i].ingredients[pickRandom]);
				}
				socket.emit('drink/random_ingredients_server', ingredients);

			}, { limit : limit, skip : randomSkip});
		});
	});

	socket.on('drink/search', function(data){
		function sendDrinks(drinks)
		{
			socket.emit('drink/search', drinks);
		}
		if(typeof data != "undefined")
		{
			mongo.find("drink", { name : new RegExp(data.keywords, 'i') }, sendDrinks, {});
		}
	});

	socket.on('login', function(data){
		var username = data.username;
		var password = data.password;

		if(
			(username == "" || password == "") || 
			(username == null || password == null) || 
			(typeof username == 'undefined' || typeof password == 'undefined')
		)
		{
			socket.emit('login', { success : false, output : "Need more data" });
		}

		var md5 = crypto.createHash('md5');
		md5.update(data.password);

		data.password = md5.digest('hex');

		mongo.find("user", data, function(result){

			if(result.data.length != 0)
			{
				//Failed to sign in
				socket.emit('login', { success : true, user : { username : result.data[0].username, password : result.data[0].password } });
			}
			else
			{
				//Signed in!
				socket.emit('login', { success : false, output : 'Your username/password combo is incorrect.' });
			}
		}, {});
	});

	socket.on('register', function(data){
		var md5 = crypto.createHash('md5');
		md5.update(data.password);

		data.password = md5.digest('hex');

		mongo.find("user", { username : data.username }, function(results){
			if(results.data.length > 0)
			{
				//User exists
				socket.emit("register", { success : false, output : "User already exists" });
			}
			else
			{
				socket.emit("register", { success : true, output : "Successfully registered!" });
				mongo.insert("user", data, function(){
				});
			}
		}, {});
	});

	socket.on('feedback', function(data){
		mongo.insert('feedback', data, function(){
			socket.emit('feedback');
		});
	});

	socket.on('answer', function(data){
		/* 
			Structured object(data):
				correct, 
				username, 
				drink_id, 
				drink_name, 
				drink_correct_answer, 
				drink_user_answer
		*/
		mongo.insert("answer", data, function(){
		});
	});

	socket.on('user/stats', function(data){
		var wrongQuestions = 0;
		var rightQuestions = 0;

		var username = data.username;

		var returnData = {};

		mongo.find("answer", { correct : false, username : username}, function(wrongQuestionsResults){
			wrongQuestions = wrongQuestionsResults.data.length;
			mongo.find("answer", { username : username}, getAllUserAnswers, {});
		}, {});

		function getAllUserAnswers(allAnswers)
		{
			rightQuestions = allAnswers.data.length - wrongQuestions;

			returnData = {
				count : allAnswers.data.length,
				rightQuestions : rightQuestions,
				wrongQuestions : wrongQuestions,
				lastQuestion : allAnswers
			};
			socket.emit('user/stats', returnData);
		}
	});

	socket.on('user/leaderboards', function(data){
		mongo.find("answer", {}, function(answers){

		}, {});
	});

	socket.on('remove_all_users', function(data){
		mongo.remove("user");

		mongo.find("user", {}, function(results){
			socket.emit('remove_all_users', results);
		}, {});
	});

	socket.on('remove_all_answers', function(data){
		mongo.remove("answer");

		console.log("Removed all answers");

		mongo.find("answer", {}, function(results){
			socket.emit('remove_all_answers', results);
		}, {});
	});

	socket.on('show_all_users', function(data){
		mongo.find("user", {}, function(results){
			socket.emit('show_all_users', results);
		}, {});
	});
});