import * as archiver from "archiver";
import * as fs from "fs";
import * as xml from "xml";
import {Formatter} from "../formatter";
import {Document} from "../../docx";
import {Styles} from "../../styles";
import {Properties} from "../../properties";
import {Numbering} from "../../numbering";
import {DefaultStylesFactory} from "../../styles/factory";

let appRoot = require("app-root-path");

export abstract class Packer {
    protected archive: any;
    private formatter: Formatter;
    protected document: Document;
    private style: Styles;
    private properties: Properties;
    private numbering: Numbering;

    constructor(document: Document, style?: any, properties?: Properties, numbering?: Numbering) {
        this.formatter = new Formatter();
        this.document = document;
        this.style = style;
        this.properties = properties;
        this.numbering = numbering;
        this.archive = archiver.create("zip", {});

        if (!style) {
            let stylesFactory = new DefaultStylesFactory();
            this.style = stylesFactory.newInstance();
        }

        if (!properties) {
            this.properties = new Properties({
                creator: "Shan Fu",
                revision: "1",
                lastModifiedBy: "Shan Fu"
            });
        }

        if (!numbering) {
            this.numbering = new Numbering();
        }

        this.archive.on("error", (err) => {
            throw err;
        });
    }

    pack(output: any): void {
        this.archive.pipe(output);
        console.log(appRoot.path + "/template");
        this.archive.bulk([
            {
                expand: true,
                cwd: appRoot.path + "/template",
                src: ["**", "**/.rels"]
            }
        ]);

        // this.archive.file(appRoot.path + "/template/[Content_Types].xml", { name: "[Content_Types].xml" });
        // console.log(__dirname + "/packer.js");
        // this.archive.file(__dirname + "/packer.js", { name: "/[Content_Types].xml" });

        /*this.archive.directory(appRoot.path + "/template", {
            name: "/root/g.txt",
            prefix: "root"
        });*/
        let xmlDocument = xml(this.formatter.format(this.document));
        let xmlStyles = xml(this.formatter.format(this.style));
        let xmlProperties = xml(this.formatter.format(this.properties), { declaration: { standalone: "yes", encoding: "UTF-8" } });
        let xmlNumbering = xml(this.formatter.format(this.numbering));
        // console.log(JSON.stringify(this.numbering, null, " "));
        console.log(xmlNumbering);
        this.archive.append(xmlDocument, {
            name: "word/document.xml"
        });

        this.archive.append(xmlStyles, {
            name: "word/styles.xml"
        });

        this.archive.append(xmlProperties, {
            name: "docProps/core.xml"
        });

        this.archive.append(xmlNumbering, {
            name: "word/numbering.xml"
        });

        this.archive.finalize();
    }
}