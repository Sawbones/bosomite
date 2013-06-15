function Boso()
{
	this.getRandom = function (callback)
	{
		function success(data)
		{
			console.log(data);
			callback(data);
		}
		$.ajax({
			url : 'http://192.168.1.1/drink/random',
			type : 'GET',
			dataType : 'json',
			success : success
		});
	}

	this.getRandomIngredients = function(callback)
	{
		function success(data)
		{
			console.log(data);
			callback(data);
		}
		$.ajax({
			url : 'http://192.168.1.1/drink/random_ingredient',
			type : 'GET',
			dataType : 'json',
			success : success
		});
	}
}