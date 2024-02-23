import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian'

export default class ExamplePlugin extends Plugin {	
	isProcessing : boolean;
	settings: ExamplePluginSettings;

	onload() : void {

		this.addSettingTab(new ExamplePluginSettingsTab(this.app, this));

		this.app.workspace.on('editor-change', editor => {

			if(this.isProcessing)
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

				if(headerRecord["author"] == "Vladimir" 
				   && headerRecord["last_edited"] == new Date().toLocaleDateString())
				{
					return;
				}

				headerRecord["author"] = "Vladimir";
				headerRecord["last_edited"] = new Date().toLocaleDateString();

				this.isProcessing = true;
				this.app.vault.process(activeFile, data => {
					console.log("5");		
					
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

    display() {
		const {containerEl} = this;

        containerEl.empty();

		new Setting(this.containerEl)
		.setName('Author')
		.setDesc('Name of the author')
		.addText(text => text
			.setPlaceholder('Enter author name')
			.setValue(this.plugin.settings.author)
			.onChange(async (value) => {
				this.plugin.settings.author = value;
				await this.plugin.saveSettings();
			}));

		new Setting(this.containerEl)
			.setName('Last Modified Date')
			.setDesc('Date when the document was last modified')
			.addText(text => text
				.setPlaceholder('Enter last modified date')
				.setValue(this.plugin.settings.lastModifiedDate)
				.onChange(async (value) => {
					this.plugin.settings.lastModifiedDate = value;
					await this.plugin.saveSettings();
				}));
    }
}

interface ExamplePluginSettings {
    author: string;
    lastModifiedDate: string;
}