import { Plugin, TFile } from 'obsidian'

export default class ExamplePlugin extends Plugin {	
	isProcessing : boolean;

	onload() : void {

		this.app.workspace.on('editor-change', editor => {

			if(this.isProcessing)
			{
				return;
			}

			var activeFile = this.app.workspace.getActiveFile();	
			if(activeFile)
			{
				const content = editor.getDoc().getValue();
	
				var header = this.addOrModifyField(content, "author", /*get from settings*/ "Vladimir" );
				header = this.addOrModifyField(content, "last_edited", /*get from settings*/ new Date().toLocaleDateString() );

				if(content.startsWith(header))
				{
					return;
				}

				this.isProcessing = true;
				this.app.vault.process(activeFile, data => {
					console.log("5");		
					
					var header = this.addOrModifyField(content, "author", /*get from settings*/ "Vladimir" );
					header = this.addOrModifyField(content, "last_edited", /*get from settings*/ new Date().toLocaleDateString() );
					
					return header + data;
				});
				this.isProcessing = false;

				console.log("4");
			}		
		})
	}

	unload(): void {

	}

	private addOrModifyField(content: string, key: string, value: string) : string {
		
		var header = ""

		var firstHeaderSectionIndex = content.indexOf("---");
		var lastHeaderSectionIndex = content.indexOf("---");


		if(firstHeaderSectionIndex >= 0 && lastHeaderSectionIndex >= 0)
		{
			header = content.substring(0, lastHeaderSectionIndex);
			console.log(header);

			const startPosition = header.indexOf(key);
			if(startPosition < 0)
			{
				header += key + ": " + value;
				return header + ;
			}
	
			const endPosition = header.indexOf("\n", startPosition);
			if(endPosition < 0)
			{
				return header;
			}
	
			header = header.substring(0, startPosition) + ": " + value + header.substring(endPosition);
		}

		return header;
	}	
} 