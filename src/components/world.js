var tileIDs = tileIDs || {};
tileIDs.tileIDair = 0;
tileIDs.tileIDgrass = 1;
tileIDs.tileIDstone = 2;
tileIDs.tileIDtree1 = 3;
tileIDs.tileIDwater = 4;


World = BaseEntity.extend({
	defaults: {
		'terrainType'		: 'grass',	// The main terrain type (grass, stone)
		'terrainFeatures'	: { 'water' : true, 'stone' : true, 'trees' : true },	// Additional terrain features that will be generated (water, stone, grass, trees)
		'chunkSize'			: 4,
		'treePercentage'	: 0.2,	// On average, 10% of (grass) tiles can be covered with trees
		'stoneOnGrassPcnt'	: 0.03,	// Stone on grass percentage
		'grassOnStonePcnt'	: 0.2,	// Grass on stone percentage
		'waterPercentage'	: 0.05,
		'terrainData'		: []
	},
	initialize: function(){
		var model = this;

		model.set({'getChunkCoords': function(x, z) {
			var tmp = [];
			tmp['x'] = Math.floor(x / model.get('chunkSize'));
			tmp['z'] = Math.floor(z / model.get('chunkSize'));

			return tmp;
		}});

		model.set({'getChunkSize': function() {

			return model.get('chunkSize');
		}});

		model.set({'chunkIsLoaded': function(chunk_x, chunk_z) {
			if(model.get('terrainData')[chunk_x] !== undefined) {
				if(model.get('terrainData')[chunk_x][chunk_z] !== undefined) {
					return true;
				}
			}

			return false;
		}});

		model.set({'generateChunk': function(chunk_x, chunk_z, type_p) {
			var type = [];
			var size = model.get('chunkSize');
			var chunkData = [];

			if(type_p !== undefined) {
				type = type_p;
			}
			else {
				type = model.get('terrainType');
			}

			if(type === 'grass') {
				// Layer 0 is the ground level terrain, layer 1 in things above ground, like trees
				chunkData[0] = [];
				chunkData[1] = [];
				for(var i = 0; i < size; i++) {
					chunkData[0][i] = [];
					chunkData[1][i] = [];
					for(var j = 0; j < size; j++) {
						chunkData[0][i][j] = tileIDs.tileIDgrass;
						chunkData[1][i][j] = tileIDs.tileIDair;
					}
				}
				model.get('terrainData')[chunk_x] = [];
				model.get('terrainData')[chunk_x][chunk_z] = chunkData.slice();
//				console.log('generateChunk(): ' + chunkData);
			}
			else if(type === 'stone') {
				chunkData[0] = [];
				chunkData[1] = [];
				for(var i = 0; i < size; i++) {
					chunkData[0][i] = [];
					chunkData[1][i] = [];
					for(var j = 0; j < size; j++) {
						chunkData[0][i][j] = tileIDs.tileIDstone;
						chunkData[1][i][j] = tileIDs.tileIDair;
					}
				}
				model.get('terrainData')[chunk_x] = [];
				model.get('terrainData')[chunk_x][chunk_z] = chunkData.slice();
			}

			return true;
		}});

		model.set({'generateFeatures': function(chunk_x, chunk_z, seed, features_p) {
			if(seed === undefined) {
				seed = "";
			}
			// Initialize the pseudorandom generator with the chunk coordinates
			Math.seedrandom('x' + chunk_x + 'z' + chunk_z + seed);
			var features = [];

			if(features_p !== undefined) {
				features = features_p;
			}
			else {
				features = model.get('terrainFeatures');
			}

			// Generate grass batches if the base terrain type is stone
			if(model.get('terrainType') === 'stone') {
				var size = model.get('chunkSize');
				var numtiles = size * size;
				var chunkData = model.get('terrainData')[chunk_x][chunk_z][0];

				for(var i = 0; i < size; i++) {
					for(var j = 0; j < size; j++) {
						if(Math.random() >= (1 - model.get('grassOnStonePcnt'))) {
							model.get('terrainData')[chunk_x][chunk_z][0][i][j] = tileIDs.tileIDgrass;
						}
					}
				}
			}

			// Generate stone batches among the grass
			if(features.hasOwnProperty('stone') && features.stone === true) {
				var size = model.get('chunkSize');
				var numtiles = size * size;
				var chunkData = model.get('terrainData')[chunk_x][chunk_z][0];

				for(var i = 0; i < size; i++) {
					for(var j = 0; j < size; j++) {
//						if(chunkData[i][j] === tileIDs.tileIDgrass) {
							if(Math.random() >= (1 - model.get('stoneOnGrassPcnt'))) {
								model.get('terrainData')[chunk_x][chunk_z][0][i][j] = tileIDs.tileIDstone;
							}
//						}
					}
				}
			}

			// Generate trees on top of grass
			if(features.hasOwnProperty('trees') && features.trees === true) {
				var size = model.get('chunkSize');
				var numtiles = size * size;
				var chunkData = model.get('terrainData')[chunk_x][chunk_z][0];
				var rnd = 0;

				for(var i = 0; i < size; i++) {
					for(var j = 0; j < size; j++) {
						if(chunkData[i][j] === tileIDs.tileIDgrass) {
							rnd = Math.random();
//							console.log('rnd: ' + rnd);
							if(rnd >= (1 - model.get('treePercentage'))) {
								model.get('terrainData')[chunk_x][chunk_z][1][i][j] = tileIDs.tileIDtree1;
							}
						}
					}
				}
			}

			// Generate water (lakes)
			if(features.hasOwnProperty('water') && features.water === true) {
				// TODO: Water needs to exist in larger quantities
				var size = model.get('chunkSize');
				var numtiles = size * size;
				var chunkData = model.get('terrainData')[chunk_x][chunk_z][0];

				for(var i = 0; i < size; i++) {
					for(var j = 0; j < size; j++) {
//						if(chunkData[i][j] === tileIDs.tileIDgrass) {
							if(Math.random() >= (1 - model.get('waterPercentage'))) {
								model.get('terrainData')[chunk_x][chunk_z][0][i][j] = tileIDs.tileIDwater;
							}
//						}
					}
				}
			}

			return true;
		}});

		model.set({'loadChunk': function(chunk_x, chunk_z) {
			var tmp = localStorage.getItem('TerrainData_x' + chunk_x + '_z' + chunk_z);

			if(tmp === null) {
//				console.log('loadChunk(): localStorage.getItem() returned null');
//				console.log('generateChunk(' + chunk_x + ', ' + chunk_z + ')');
				model.attributes.generateChunk(chunk_x, chunk_z);
//				console.log(model.get('terrainData'));
//				console.log('generateFeatures(' + chunk_x + ', ' + chunk_z + ')');
				model.attributes.generateFeatures(chunk_x, chunk_z);
			}
			else {
//				console.log('loadChunk(): localStorage.getItem() returned data');
				if(model.get('terrainData')[chunk_x] === undefined) {
					model.get('terrainData')[chunk_x] = [];
					model.get('terrainData')[chunk_x][chunk_z] = [];
				}
				else if(model.get('terrainData')[chunk_x][chunk_z] === undefined) {
					model.get('terrainData')[chunk_x][chunk_z] = [];
				}
				model.get('terrainData')[chunk_x][chunk_z] = JSON.parse(tmp);
			}

			return true;
		}});

		model.set({'unloadChunk': function(chunk_x, chunk_z) {
			var str = "";
//			console.log('unloadChunk()' + model.get('terrainData'));
			str = JSON.stringify(model.get('terrainData')[chunk_x][chunk_z]);
//			console.log('str: ' + str);
			localStorage.setItem('TerrainData_x' + chunk_x + '_z' + chunk_z, str);
			model.get('terrainData')[chunk_x][chunk_z].splice();

			return true;
		}});

		model.set({'deleteWorld': function() {
			localStorage.clear();

			return true;
		}});
	}
});