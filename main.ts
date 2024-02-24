import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian'

export default class ExamplePlugin extends Plugin {	
	isProcessing : boolean;
	settings: ExamplePluginSettings;

	async onload() {

		this.addSettingTab(new ExamplePluginSettingsTab(this.app, this));

		await this.loadSettings();

		this.app.workspace.on('editor-change', editor => {

			if(this.isProcessing)
			{
				return;
			}

			if(!this.settings.author)
			{
				return;
			}

			var activeFile = this.app.workspace.getActiveFile();	
			if(activeFile)
			{
				const content = editor.getDoc().getValue();

				var firstHeaderSectionIndex = content.indexOf("---");
				var lastHeaderSectionIndex = content.indexOf("---");

				var headerRecord : Record<string, string> = {};
				if(firstHeaderSectionIndex >= 0 && lastHeaderSectionIndex >= 0)
				{
					const header = content.substring(firstHeaderSectionIndex, lastHeaderSectionIndex);
					headerRecord = this.parseFrontmatterProperties(header);
				}

				const currentDate = new Date().toLocaleDateString();

				if(headerRecord["author"] == this.settings.author
				   && headerRecord["last_edited"] == currentDate)
				{
					return;
				}

				headerRecord["author"] = this.settings.author;
				headerRecord["last_edited"] = currentDate;

				this.isProcessing = true;
				this.app.vault.process(activeFile, data => {

					data = this.updateFrontmatter(data, headerRecord);
					
					return data;
				});
				this.isProcessing = false;

				console.log("4");
			}		
		})
	}

	unload(): void {

	}

	private parseFrontmatterProperties(contents: string): Record<string, string> {
		const frontmatterRegex = /^---\s*\n([\s\S]+?)\n---\s*\n/;
		const match = contents.match(frontmatterRegex);
	
		if (match && match.length > 1) {
			const frontmatterContent = match[1];
			const properties: Record<string, any> = {};
				
			// Split frontmatter content into lines
			const lines = frontmatterContent.split('\n');
	
			// Parse each line for key-value pairs
			lines.forEach(line => {
				const keyValueMatch = line.match(/^\s*([^:]+?)\s*:\s*(.+?)\s*$/);
				if (keyValueMatch && keyValueMatch.length === 3) {
					const key = keyValueMatch[1].trim();
					const value = keyValueMatch[2].trim();
					properties[key] = value;
				}
			});
	
			return properties;
		} 
		else {
			return {};
		}
	}

	private updateFrontmatter(contents: string, updatedProperties: Record<string, string>): string {
		const frontmatterRegex = /^---\s*\n([\s\S]+?)\n---\s*\n/;
		const match = contents.match(frontmatterRegex);

		if (match && match.length > 1) {
			const frontmatterContent = match[1];
			let updatedFrontmatterContent = frontmatterContent;

			// Parse each property in updatedProperties and update the frontmatter content
			Object.keys(updatedProperties).forEach(key => {
				const value = updatedProperties[key];
				const regex = new RegExp(`^\\s*${key}\\s*:\\s*.+?\\s*$`, 'm');
				updatedFrontmatterContent = updatedFrontmatterContent.replace(regex, `${key}: ${value}`);
			});

			// Replace the old frontmatter section with the updated one
			const updatedContents = contents.replace(frontmatterRegex, `---\n${updatedFrontmatterContent.trim()}\n---\n`);

			return updatedContents;
		} else {
			// If no frontmatter section found, add a new one with the updated properties
			const frontmatterContent = Object.entries(updatedProperties).map(([key, value]) => `${key}: ${value}`).join('\n');
			const newFrontmatter = `---\n${frontmatterContent}\n---\n${contents.trim()}`;
			return newFrontmatter;
		}
	}	

	async loadSettings() {
        this.settings = Object.assign({}, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
} 

class ExamplePluginSettingsTab extends PluginSettingTab {
    plugin: ExamplePlugin;

    constructor(app: App, plugin: ExamplePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let { containerEl } = this;

        containerEl.empty();
        containerEl.createEl('h2', { text: 'Note header manager settings' });

		console.log("start");		
		console.log(this.plugin.settings.author);		
		console.log("end");

        new Setting(containerEl)
            .setName('Author')
            .setDesc("Name of the author")
            .addText(text => text
                .setValue(this.plugin.settings.author)
				.onChange(async (value) => {
					console.log(value);

                    this.plugin.settings.author = value;
					await this.plugin.saveSettings();
                }));
    }
}

class ExamplePluginSettings {
	author : string;
}