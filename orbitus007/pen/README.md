# ThreeJS-PubChemAdaptor

http://orbitusbiomedical.github.io/ThreeJS-PubChemAdaptor/

Try searching for any molecule like "caffeine" or "aspirin" in the above web example.

This code is a Three.js adaptor to fetch chemicals based on the name and display them on the screen with as little code as possible.

We fetch from the PubChem databank of compounds in a google search field styled fasion. I use the javascript Three.js library to render, derriving the rendering code from the css3D rendering examples found here:http://threejs.org/examples/#css3d_molecules


Please ask any questions and I can try to answer them but I am very busy at the moment so forgive the delay!

For science and an open source of knowledge!




PubChem REST URL Requests:
Please note that caffeine needs to be the search phrase you want to search for:

https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/caffeine/JSON?record_type=3d



TODO: Implement this protocol and show a similar results in case your search does not match an exact chemical:

https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/fructose/cids/JSON?name_type=word