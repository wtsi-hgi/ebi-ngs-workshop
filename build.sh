#!/usr/bin/env bash

set -eux -o pipefail

PROJECT_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

BUILD_DIRECTORY=${PROJECT_DIRECTORY}/build
BUILD_DAY_1_DIRECTORY=${BUILD_DIRECTORY}/1-JoshRandall
BUILD_DAY_2_DIRECTORY=${BUILD_DIRECTORY}/2-JoshRandall

# Functions
## Converts pptx to pdf
function convert-pptx-to-pdf {
    inputFile=$1
    outputFile=$2
    docker run --entrypoint=sh -v $(dirname ${inputFile}):/input -v $(dirname ${outputFile}):/output xcgd/libreoffice \
        /usr/bin/libreoffice --headless --convert-to pdf --outdir /output /input/$(basename ${inputFile})
    mv $(dirname ${outputFile})/$(basename ${inputFile%.*}).pdf ${outputFile}
}
## Converts tex to pdf
function convert-tex-to-pdf {
    inputFile=$1
    outputFile=$2
    inputFileDirectory=$(dirname ${inputFile})
    # TODO: Should copy directory as this messes with the original
    _realise-symlinks ${inputFileDirectory}
    docker run -v ${inputFileDirectory}:/data --workdir=/data headgeekette/latex $(basename ${inputFile})
    _restore-symlinks ${inputFileDirectory}
    mv ${inputFile%.*}.pdf ${outputFile}
}
## Converts dia to pdf
function convert-dia-to-pdf {
    inputFile=$1
    outputFile=$2
    inputFileDirectory=$(dirname ${inputFile})
    inputFileName=$(basename ${inputFile%.*})
    docker run -v ${inputFileDirectory}:/data --entrypoint=dia vpavlin/dia \
        -e /data/${inputFileName}.svg /data/${inputFileName}.dia
    docker run -v ${inputFileDirectory}:/input -v $(dirname ${outputFile}):/output rasch/inkscape \
        inkscape /input/${inputFileName}.svg --export-area-drawing --without-gui --export-pdf=/output/$(basename ${outputFile})
    rm -f ${inputFileDirectory}/${inputFileName}.svg
}
## Replaces soft links with hard links, keeping backup of soft links
function _realise-symlinks {
    directory=$1
    for link in $(find ${directory} -type l)
    do
        linked=$(readlink $link)
        mv ${link} ${link}.backup
        # Preferring hard-link over copy
        ln ${directory}/${linked} ${directory}/
    done
}
## Replaces hard-links by backed-up hard links
function _restore-symlinks {
    directory=$1
    for link in $(find ${directory}/*.backup)
    do
        originalFile=${link%.*}
        rm ${originalFile}
        mv ${link} ${originalFile}
    done
}

# Ensure files in LFS have been downloaded
cd ${PROJECT_DIRECTORY}
git lfs checkout

# Setup build directory
rm -rf ${BUILD_DIRECTORY}
mkdir ${BUILD_DIRECTORY}
mkdir ${BUILD_DAY_1_DIRECTORY}
mkdir ${BUILD_DAY_2_DIRECTORY}

# Lectures
## Presentations
### Creates pdf copies of powerpoints
convert-pptx-to-pdf ${PROJECT_DIRECTORY}/lectures/EBI_NGS_Bioinformatics_Overview.pptx ${BUILD_DAY_1_DIRECTORY}/1-EBI_NGS_Bioinformatics_Overview.pdf
convert-pptx-to-pdf ${PROJECT_DIRECTORY}/lectures/EBI_NGS_rsvc_slides.pptx ${BUILD_DAY_2_DIRECTORY}/1a-EBI_NGS_rsvc_slides.pdf
## Smith waterman demo
cp -r ${PROJECT_DIRECTORY}/lectures/smith-waterman-demo ${BUILD_DAY_2_DIRECTORY}/1b-smith-waterman-demo

# Practicals
## Data formats practical
convert-tex-to-pdf ${PROJECT_DIRECTORY}/practicals/NGS-workshop-data-formats/worksheet/EBI_NGS_data_formats_practical.tex ${BUILD_DAY_1_DIRECTORY}/2a-EBI_NGS_data_formats_practical.pdf
cp ${PROJECT_DIRECTORY}/practicals/NGS-workshop-data-formats/EBI_NGS_data_formats_lab.tgz ${BUILD_DAY_1_DIRECTORY}
## RSVC practical
convert-tex-to-pdf ${PROJECT_DIRECTORY}/practicals/NGS-workshop-reseq-var/worksheet/EBI_NGS_rsvc_practical.tex ${BUILD_DAY_2_DIRECTORY}/2a-EBI_NGS_rsvc_practical.pdf
cp ${PROJECT_DIRECTORY}/practicals/NGS-workshop-reseq-var/EBI_NGS_rsvc_lab.tgz ${BUILD_DAY_2_DIRECTORY}/
convert-dia-to-pdf ${PROJECT_DIRECTORY}/practicals/NGS-workshop-reseq-var/EBI_NGS_rsvc-bwa-samtools-mapping-and-variant-calling.dia ${BUILD_DAY_2_DIRECTORY}/2b-EBI_NGS_rsvc-bwa-samtools-mapping-and-variant-calling.pdf

## Package it up
cd ${BUILD_DIRECTORY}
tar -czvf hgi-ngs-course.tar.gz $(basename ${BUILD_DAY_1_DIRECTORY}) $(basename ${BUILD_DAY_2_DIRECTORY})
rm -rf ${BUILD_DAY_1_DIRECTORY}
rm -rf ${BUILD_DAY_2_DIRECTORY}
