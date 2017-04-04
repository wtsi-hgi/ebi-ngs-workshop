# EBI Next Generation Sequencing (NGS) Workshop

## Download
Clone the repository and then checkout the large files with Git LFS:
```bash
git clone git@github.com:wtsi-hgi/ebi-ngs-workshop.git
cd ebi-ngs-workshop
git lfs checkout
```
*Note: Some git versions/setups do download the large files during the clone.*


## Build
To build the course materials, run `build.sh` (requires `docker`).


## Deployment
### Software Requirements
* eog
* IGV
* bcftools 1.3.1
* samtools 1.3.1
* gnuplot
* An image viewer capable of opening PDFs, configured with xdg-open
* matplotlib Python module
* picard-tools
* vcftools
* LaTeX

### Materials
- Ideally, bake the material into the student's home directory on the VM image.
- Provide a read-only backup tar on the remote drive, which will allow students who accidentally destroy files to recover!
