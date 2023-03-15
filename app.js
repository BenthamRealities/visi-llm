import { callGPT } from './gpt.js';

const groups = [];

function updateDataTextarea(dataTextarea, refResultTextarea, groupName) {
    const group = groups.find(group => group.name === groupName);
    if (!group) {
        dataTextarea.style.display = 'none';
        refResultTextarea.style.display = 'block';
        refResultTextarea.classList.add('error');
        refResultTextarea.value = 'Error: Group not found.';
        return;
    }

    if (group.result) {
        dataTextarea.style.display = 'none';
        refResultTextarea.style.display = 'block';
        refResultTextarea.classList.remove('error');
        refResultTextarea.value = group.result;
    } else {
        dataTextarea.style.display = 'block';
        refResultTextarea.style.display = 'none';
    }
}

function addEventListenersToGroup(group, index) {
    let timer = null;
    let lastRequestTime = 0;
    let latestRequestId = 0;

    function handleInputChange() {
        console.log('handleInputChange called');
        clearTimeout(timer);
        const currentTime = Date.now();

        if (currentTime - lastRequestTime < 5000) {
            console.log('Waiting for 5 seconds');
            timer = setTimeout(handleInputChange, 5000 - (currentTime - lastRequestTime));
            return;
        }

        lastRequestTime = currentTime;
        const dataInput = group.querySelector('.data-text');
        const transformInput = group.querySelector('.transform-text');

        if (dataInput.value && transformInput.value) {
            latestRequestId++;
            const requestId = latestRequestId;
            console.log(`Sending request ${requestId} with ${dataInput.value} and ${transformInput.value}`);
            callGPT(dataInput.value, transformInput.value).then((result) => {
                console.log(`Received result for request ${requestId}`);
                if (requestId !== latestRequestId) return;

                groups[index].result = result;

                let resultParagraph = group.querySelector('.result');

                if (!resultParagraph) {
                    resultParagraph = document.createElement('p');
                    resultParagraph.className = 'result';
                    group.appendChild(resultParagraph);
                }

                resultParagraph.textContent = result;

                // Update all data textareas with the new result
                document.querySelectorAll('.data-text').forEach(dataTextarea => {
                    const groupNameMatch = dataTextarea.value.match(/#(.+)/);
                    if (groupNameMatch && groupNameMatch[1] === groups[index].name) {
                        updateDataTextarea(dataTextarea, groupNameMatch[1]);
                    }
                });
            });
        }
    }

    group.querySelectorAll('.data-text, .transform-text').forEach(input => {
        input.addEventListener('change', handleInputChange);
    });

    group.querySelector('.group-name').addEventListener('input', (event) => {
        groups[index].name = event.target.value;
        console.log(`Group ${index} name now:${groups[index].name})`)
    });

    const dataTextarea = group.querySelector('.data-text');
    const refResultTextarea = group.querySelector('.referenced-result-text');

    dataTextarea.addEventListener('input', () => {
        const groupNameMatch = dataTextarea.value.match(/#(.+)/);

        if (groupNameMatch) {
            updateDataTextarea(dataTextarea, refResultTextarea, groupNameMatch[1]);
        }
    });

    refResultTextarea.addEventListener('focus', () => {
        refResultTextarea.style.display = 'none';
        dataTextarea.style.display = 'block';
        const originalValue = groups[index].data;
        if (originalValue) {
            dataTextarea.value = originalValue;
        }
    });

    refResultTextarea.addEventListener('blur', () => {
        const groupNameMatch = dataTextarea.value.match(/#(.+)/);
        if (groupNameMatch) {
            updateDataTextarea(dataTextarea, refResultTextarea, groupNameMatch[1]);
        }
    });
}


function addGroup() {
    const group = document.createElement('div');
    group.className = 'group';
    group.innerHTML = `
        <input type="text" class="group-name" placeholder="Group Name">
        <textarea class="data-text" placeholder="Data Text"></textarea>
        <textarea class="referenced-result-text" placeholder="Referenced Result" readonly></textarea>
        <textarea class="transform-text" placeholder="Transform Text"></textarea>
    `;

    const btn = document.querySelector('.add-group-btn');
    btn.parentNode.insertBefore(group, btn);

    const index = groups.length;
    groups.push({ name: '', data: '', transform: '', result: null });

    addEventListenersToGroup(group, index);
}

document.querySelector('.add-group-btn').addEventListener('click', addGroup);

addGroup();
