# Cubie meets Jekyll

## The little front-end companion meets the power of Jekyll

Cubie is an HTML5 starter kit that includes: package and task management, local server with browser synchronization, beautiful auto-generated documentation, styles pre-processor, files minification and images optimisation.

## Requirements

You'll need to have the following things installed before continuing.

  * [Ruby](https://www.ruby-lang.org/en/documentation/installation/): Use the installer provided on the website.
  * [Node.js](https://nodejs.org/en/): Use the installer provided on the NodeJS website.
  * [Yarn](https://yarnpkg.com/lang/en/docs/install/): In the terminal run `yarn install --global gulp`

## Quickstart

Open you terminal, go to the folder: `cd [your_path]/frontend-cubie/`
And then install the dependencies:

```
yarn
bundle install
```

## Commands

* `gulp serve`
* `gulp deploy` builds and uploads using provided SFTP-configuration in `config.sftp.json`

## SFTP Config

To deploy set a config.

<pre>
	{
		"SFTPHOST" : "whatever.host",
		"SFTPUSER" : "username",
		"SFTPPWD"   : "password",
		"NODE_TLS_REJECT_UNAUTHORIZED": "0"
	}
</pre>

## Directory Structure

* `src/`: The sources
* `src/jekyll`: The content
* `src/assets`: Images, fonts, icons...
* `src/scripts`: Javascripts
* `src/styles`: SASS files

* `dist/`: The generated pages (overwritten overtime your run gulp)

## How to add an icon?

* Start by creating or choosing a vector icon from the [Entypo library](http://www.entypo.com/)
* Add the SVG-formatted icon in `src/assets/icons/`
* Link your icon in the html:

```
<svg class="icon-{name_of_you_icon}"><use xlink:href="#icon-{name_of_you_icon}"></use></svg>
```

* Run `gulp` again

## Translations

* Translations are found in the directory `src/jekyll/_data/locales`

## Author

Cubie was made by [Pierre Fritsch](https://github.com/pfritsch) for [We Are Cube.³](https://github.com/wearecube).

## License

Front-end Cubie is licensed under the Apache 2.0 License
