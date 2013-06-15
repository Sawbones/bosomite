function Game()
{
	var canvas = document.getElementById("game");
	var c = canvas.getContext("2d");


	//Sets basic things
	c.fillStyle = "#FFF";
	c.lineWidth = 3;
	this.init = function()
	{

	}

	this.render = function(delta)
	{
		c.fillRect(0, 0, canvas.width, canvas.height);
	}
}